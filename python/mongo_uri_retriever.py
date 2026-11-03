"""Periodic MongoDB connection-string retriever with safe hot-swap (pymongo).

Sources, highest priority first: MONGODB_URI_FILE (e.g. a Render secret file),
.env (re-read on every poll), then MONGODB_URI / MONGO_URL environment variables.

    from mongo_uri_retriever import MongoManager
    mgr = MongoManager()
    db = mgr.client["jesses_digital_ventures"]   # always use mgr.client; it is swapped on rotation
"""
import logging
import os
import re
import threading
from pathlib import Path
from typing import Callable, Optional
from urllib.parse import quote_plus

from pymongo import MongoClient
from pymongo.errors import (ConfigurationError, InvalidURI, OperationFailure,
                            PyMongoError, ServerSelectionTimeoutError)

log = logging.getLogger("mongo")
LOCAL_URI = "mongodb://localhost:27017/jesses_digital_ventures"
DEFAULT_INTERVAL_S = 300
MIN_INTERVAL_S = 10
_AUTH_CODES = {18, 13}


def encode_password(password: str) -> str:
    """Use when building a URI by hand: @ -> %40, : -> %3A, etc."""
    return quote_plus(password)


def redact(text: str) -> str:
    return re.sub(r"(mongodb(?:\+srv)?://)[^/\s]*@", r"\1***:***@", str(text), flags=re.I)


def describe(uri: str) -> str:
    m = re.match(r"^(mongodb(?:\+srv)?)://(?:[^/]*@)?([^/?]+)(?:/([^?]*))?", uri, re.I)
    return f"{m.group(1)}://***@{m.group(2)}/{m.group(3) or ''}" if m else "unparseable URI"


def check_encoding(uri: str) -> None:
    m = re.match(r"^mongodb(?:\+srv)?://(.*)$", uri, re.I | re.S)
    if not m or "@" not in m.group(1):
        return
    creds = m.group(1).rsplit("@", 1)[0]
    parts = creds.split(":")
    password = ":".join(parts[1:])
    if len(parts) > 2 or re.search(r"[@/?#\[\]]", password):
        log.warning("Password appears to contain unencoded special characters; "
                    "URL-encode them (@ -> %40, : -> %3A, / -> %2F). Use urllib.parse.quote_plus.")


def is_auth_error(err: Exception) -> bool:
    return isinstance(err, OperationFailure) and (err.code in _AUTH_CODES or "auth" in str(err).lower())


def is_bad_uri(err: Exception) -> bool:
    return isinstance(err, (InvalidURI, ConfigurationError))


def log_error(context: str, err: Exception) -> None:
    code = getattr(err, "code", None)
    hint = ""
    if is_auth_error(err):
        hint = " | Hint: credentials rejected (expired/rotated password, wrong user, or authSource)."
    elif isinstance(err, ServerSelectionTimeoutError):
        hint = " | Hint: network/DNS/IP allowlist problem (check Atlas Network Access)."
    elif is_bad_uri(err):
        hint = " | Hint: malformed URI; check password URL-encoding."
    log.error("%s: type=%s code=%s message=%s%s", context, type(err).__name__, code, redact(str(err)), hint)


def _read_dotenv() -> str:
    try:
        from dotenv import dotenv_values
    except ImportError:
        return ""
    vals = dotenv_values(Path(__file__).resolve().parent.parent / ".env")
    return (vals.get("MONGODB_URI") or vals.get("MONGO_URL") or "").strip()


def _read_file() -> str:
    path = os.environ.get("MONGODB_URI_FILE")
    if not path:
        return ""
    try:
        return Path(path).read_text().strip()
    except OSError as e:
        log.warning("Cannot read MONGODB_URI_FILE (%s)", type(e).__name__)
        return ""


def resolve_uri() -> str:
    uri = _read_file() or _read_dotenv() or (os.environ.get("MONGODB_URI") or os.environ.get("MONGO_URL") or "").strip()
    if uri:
        return uri
    if os.environ.get("APP_ENV") == "production" or os.environ.get("ENV") == "production":
        raise RuntimeError("No MongoDB URI found; refusing localhost in production")
    return LOCAL_URI


def _new_client(uri: str, timeout_ms: int = 10000) -> MongoClient:
    # pymongo reconnects after network drops on its own; retryWrites/retryReads cover transient errors.
    return MongoClient(uri, serverSelectionTimeoutMS=timeout_ms, heartbeatFrequencyMS=10000,
                       socketTimeoutMS=45000, maxPoolSize=10, retryWrites=True, retryReads=True)


class MongoManager:
    def __init__(self, interval_s: Optional[float] = None, on_swap: Optional[Callable[[MongoClient], None]] = None):
        env = os.environ.get("MONGODB_URI_REFRESH_S")
        self.interval = max(MIN_INTERVAL_S, float(interval_s or env or DEFAULT_INTERVAL_S))
        self.on_swap = on_swap
        self._lock = threading.Lock()
        self._stop = threading.Event()
        self._uri = resolve_uri()
        self._client = self._connect_blocking()
        threading.Thread(target=self._poll, name="mongo-uri-retriever", daemon=True).start()
        log.info("URI retriever started (every %ss)", int(self.interval))

    @property
    def client(self) -> MongoClient:
        with self._lock:
            return self._client

    def close(self) -> None:
        self._stop.set()
        self.client.close()

    def _connect_blocking(self) -> MongoClient:
        attempt = 0
        while not self._stop.is_set():
            attempt += 1
            check_encoding(self._uri)
            log.info("Connecting to %s", describe(self._uri))
            try:
                client = _new_client(self._uri)
                client.admin.command("ping")
                log.info("Database connected")
                return client
            except PyMongoError as err:
                log_error(f"connect attempt {attempt} failed", err)
                if is_auth_error(err) or is_bad_uri(err):
                    log.error("Non-retryable error; waiting for a new connection string.")
                    self._wait_for_new_uri()
                    attempt = 0
                    continue
                delay = min(2 ** min(attempt, 5), 30)
                log.warning("Retrying in %ss", delay)
                self._stop.wait(delay)
        raise RuntimeError("stopped before connecting")

    def _wait_for_new_uri(self) -> None:
        # Poll slowly: hammering rejected credentials can lock the Atlas user.
        while not self._stop.wait(self.interval):
            try:
                new = resolve_uri()
            except RuntimeError:
                continue
            if new != self._uri:
                log.info("New connection string found; retrying")
                self._uri = new
                return

    def _poll(self) -> None:
        while not self._stop.wait(self.interval):
            try:
                new = resolve_uri()
            except RuntimeError as e:
                log.warning("%s", e)
                continue
            if new == self._uri:
                continue
            log.info("Connection string change detected")
            check_encoding(new)
            try:
                probe = _new_client(new, 8000)
                probe.admin.command("ping")  # validate before touching the live client
            except PyMongoError as err:
                log_error("new URI rejected; keeping current connection", err)
                continue
            with self._lock:
                old, self._client, self._uri = self._client, probe, new
            old.close()
            log.info("Switched to rotated connection string")
            if self.on_swap:
                try:
                    self.on_swap(probe)
                except Exception:
                    log.exception("on_swap callback failed")
