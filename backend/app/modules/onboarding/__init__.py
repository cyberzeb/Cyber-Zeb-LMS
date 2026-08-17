"""
Onboarding domain: public service requests → Super Admin review →
invoice → payment confirmation → tenant activation.

Platform-global (not tenant-scoped). Institution admins never see
ServiceRequest rows — that boundary is enforced at the API layer.
"""
