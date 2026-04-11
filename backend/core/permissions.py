from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    """
    Grants access only to authenticated staff/superusers.
    Used across all SMS admin-only viewsets.
    """
    message = 'Admin access required. You must be a staff member to perform this action.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_staff
        )

    def has_object_permission(self, request, view, obj):
        # Object-level: same rule — must be staff
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_staff
        )