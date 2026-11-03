from django.contrib.auth.models import User
from django.test import TestCase, Client
from .models import Task

class TaskSecurityTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user("owner", password="Correct-Horse-74!")
        self.other = User.objects.create_user("other", password="Correct-Horse-74!")
        self.task = Task.objects.create(owner=self.owner, text="Private")

    def test_anonymous_cannot_read_tasks(self):
        self.assertEqual(self.client.get("/api/tasks/").status_code, 403)

    def test_users_cannot_read_modify_or_delete_others_tasks(self):
        self.client.force_login(self.other)
        self.assertEqual(self.client.get("/api/tasks/").json(), [])
        path = f"/api/tasks/{self.task.id}/"
        self.assertEqual(self.client.get(path).status_code, 404)
        self.assertEqual(self.client.patch(path, data={"completed": True}, content_type="application/json").status_code, 404)
        self.assertEqual(self.client.delete(path).status_code, 404)

    def test_task_lifecycle_and_validation(self):
        self.client.force_login(self.owner)
        self.assertEqual(self.client.post("/api/tasks/", {"text": "   "}, content_type="application/json").status_code, 400)
        self.assertEqual(self.client.post("/api/tasks/", {"text": "x" * 121}, content_type="application/json").status_code, 400)
        response = self.client.post("/api/tasks/", {"text": "  Test  ", "owner": self.other.id}, content_type="application/json")
        self.assertEqual(response.status_code, 201)
        task = Task.objects.get(id=response.json()["id"])
        self.assertEqual(task.owner, self.owner)
        self.assertEqual(task.text, "Test")
        path = f"/api/tasks/{task.id}/"
        self.assertEqual(self.client.patch(path, {"completed": True}, content_type="application/json").status_code, 200)
        self.assertTrue(self.client.get(path).json()["completed"])
        self.assertEqual(self.client.delete(path).status_code, 204)

    def test_clear_completed_is_owner_scoped(self):
        self.task.completed = True
        self.task.save()
        self.client.force_login(self.other)
        self.client.delete("/api/tasks/completed/")
        self.assertTrue(Task.objects.filter(pk=self.task.pk).exists())

    def test_login_and_register_require_csrf(self):
        client = Client(enforce_csrf_checks=True)
        for route in ["login", "register", "logout"]:
            self.assertEqual(client.post(f"/api/{route}/", {}, content_type="application/json").status_code, 403)
        token = client.get("/api/session/").json()["csrfToken"]
        response = client.post("/api/login/", {"username": "owner", "password": "Correct-Horse-74!"}, content_type="application/json", HTTP_X_CSRFTOKEN=token)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(client.get("/api/session/").json()["user"]["username"], "owner")
        token = response.json()["csrfToken"]
        self.assertEqual(client.post("/api/logout/", {}, content_type="application/json", HTTP_X_CSRFTOKEN=token).status_code, 200)
        self.assertIsNone(client.get("/api/session/").json()["user"])

    def test_registration_creates_session_and_rejects_duplicate(self):
        client = Client(enforce_csrf_checks=True)
        token = client.get('/api/session/').json()['csrfToken']
        payload = {'username': 'new-reader', 'password': 'Not-A-Common-Pass-882!'}
        response = client.post('/api/register/', payload, content_type='application/json', HTTP_X_CSRFTOKEN=token)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(client.get('/api/session/').json()['user']['username'], 'new-reader')
        token = response.json()['csrfToken']
        self.assertEqual(client.post('/api/register/', payload, content_type='application/json', HTTP_X_CSRFTOKEN=token).status_code, 400)

    def test_weak_password_is_rejected(self):
        response = self.client.post('/api/register/', {'username': 'weak', 'password': '123'}, content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertFalse(User.objects.filter(username='weak').exists())
