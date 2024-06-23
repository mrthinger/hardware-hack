import logging
from typing import Any, Optional

import jwt
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer, SecurityScopes

from api.settings import Settings

logger = logging.getLogger(__name__)


class UnauthenticatedException(HTTPException):
    def __init__(self) -> None:
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail="This request was not authorized correctly.")


class VerifyToken:
    """Does all the token verification using PyJWT"""

    def __init__(self) -> None:
        self.config = Settings()

        # This gets the JWKS from a given URL and does processing so you can
        # use any of the keys available
        jwks_url = f"https://{self.config.auth0_domain}/.well-known/jwks.json"
        self.jwks_client = jwt.PyJWKClient(jwks_url)

    async def verify(
        self, security_scopes: SecurityScopes, credentials: Optional[HTTPAuthorizationCredentials] = Security(HTTPBearer())  # noqa: B008
    ) -> Any:
        if credentials is None:
            raise UnauthenticatedException()

        try:
            signing_key = self.jwks_client.get_signing_key_from_jwt(credentials.credentials).key
        except jwt.PyJWKClientError as error:
            logger.error(error, extra={"credentials": credentials})
            raise UnauthenticatedException() from error
        except jwt.exceptions.DecodeError as error:
            logger.error(error, extra={"credentials": credentials})
            raise UnauthenticatedException() from error

        try:
            payload = jwt.decode(
                credentials.credentials,
                signing_key,
                algorithms=[self.config.auth0_algorithms],
                audience=self.config.auth0_api_audience,
                issuer=self.config.auth0_issuer,
            )
            logger.info("Decoded token", extra={"token": payload})
            return payload
        except jwt.ExpiredSignatureError as error:
            logger.error(error, extra={"credentials": credentials})
            # Handle token expiration, e.g., refresh token, re-authenticate, etc.
        except jwt.PyJWTError as error:
            logger.error(error, extra={"credentials": credentials})
            # Handle other JWT errors
        raise UnauthenticatedException()
