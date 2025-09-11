"""
JWT utilities for Supabase authentication.

This module contains utilities for working with Supabase JWT tokens.
Token validation is handled by the Supabase client itself.
"""

from typing import Optional, Dict, Any


def decode_jwt_payload(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode JWT payload without verification.
    
    Note: This is for informational purposes only.
    Actual token validation is handled by Supabase client.
    """
    # TODO: Implement if needed for debugging/logging purposes
    return None


def get_user_id_from_token(token: str) -> Optional[str]:
    """
    Extract user ID from JWT token.
    
    Note: This is for informational purposes only.
    Actual user identification is handled by Supabase RLS.
    """
    # TODO: Implement if needed for debugging/logging purposes
    return None
