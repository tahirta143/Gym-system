from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed


class QueryParamTokenAuthentication(TokenAuthentication):
    """
    Custom DRF authentication class that reads the token from the
    'token' URL query parameter instead of the Authorization header.

    This is needed for direct browser download links (e.g. PDF receipts,
    payslips) where the browser cannot set custom headers.

    Usage: GET /api/fees/1/receipt/?token=<your_token>
    """

    def authenticate(self, request):
        token_key = request.query_params.get('token')
        if not token_key:
            # No query param token — fall through to let the next
            # authenticator (header-based TokenAuthentication) try.
            return None
        return self.authenticate_credentials(token_key)
