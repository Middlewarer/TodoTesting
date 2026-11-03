from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.forms import UserCreationForm
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from .models import Task
from .serializers import TaskSerializer

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return Task.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=False, methods=["delete"])
    def completed(self, request):
        self.get_queryset().filter(completed=True).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class SessionView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"user": {"username": request.user.username} if request.user.is_authenticated else None, "csrfToken": get_token(request)})

@method_decorator(csrf_protect, name="dispatch")
class AuthView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

class RegisterView(AuthView):
    def post(self, request):
        form = UserCreationForm(data={"username": request.data.get("username"), "password1": request.data.get("password"), "password2": request.data.get("password")})
        if not form.is_valid():
            return Response({"detail": " ".join(str(error) for errors in form.errors.values() for error in errors)}, status=400)
        user = form.save()
        login(request, user)
        return Response({"user": {"username": user.username}, "csrfToken": get_token(request)}, status=201)

class LoginView(AuthView):
    def post(self, request):
        user = authenticate(request, username=request.data.get("username"), password=request.data.get("password"))
        if user is None:
            return Response({"detail": "Неверное имя пользователя или пароль."}, status=400)
        login(request, user)
        return Response({"user": {"username": user.username}, "csrfToken": get_token(request)})

class LogoutView(AuthView):
    def post(self, request):
        logout(request)
        return Response({"user": None, "csrfToken": get_token(request)})
