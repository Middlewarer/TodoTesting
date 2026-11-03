from django.contrib import admin
from django.urls import include, path
from django.views.generic import TemplateView
from django.http import JsonResponse
from rest_framework.routers import DefaultRouter
from tasks.views import TaskViewSet, SessionView, RegisterView, LoginView, LogoutView
router = DefaultRouter()
router.register("tasks", TaskViewSet, basename="task")
urlpatterns = [path("admin/", admin.site.urls), path("health/", lambda request: JsonResponse({"status": "ok"})), path("api/session/", SessionView.as_view()), path("api/register/", RegisterView.as_view()), path("api/login/", LoginView.as_view()), path("api/logout/", LogoutView.as_view()), path("api/", include(router.urls)), path("", TemplateView.as_view(template_name="index.html"))]
