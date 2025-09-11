"""
Row Level Security (RLS) utilities.

This module contains utilities for working with Supabase RLS policies.
The actual RLS policies should be defined in your Supabase database
and will automatically enforce access control based on auth.uid().
"""

from typing import Dict, Any


def get_user_context() -> Dict[str, Any]:
    """Get the current user context for RLS."""
    # This is handled automatically by Supabase when using user-scoped clients
    # RLS policies will use auth.uid() to filter results
    return {}
