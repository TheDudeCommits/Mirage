import ast
import unittest
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
PYTHON_SERVICES = (
    "Back-AI-Img-Detector/app.py",
    "Back-AI-Text-Detector/main.py",
    "Back-AI-Text-Detector/run-on-port-5001.py",
    "Back-TextChat/app.py",
    "Back-VoiceChat/app.py",
)


def broad_exception_handlers(tree):
    return (
        node
        for node in ast.walk(tree)
        if isinstance(node, ast.ExceptHandler)
        and isinstance(node.type, ast.Name)
        and node.type.id == "Exception"
    )


class ErrorBoundaryHardeningTests(unittest.TestCase):
    def test_broad_exception_handlers_log_fixed_server_side_messages(self):
        for relative_path in PYTHON_SERVICES:
            tree = ast.parse((REPOSITORY_ROOT / relative_path).read_text())

            for handler in broad_exception_handlers(tree):
                diagnostic_calls = [
                    node
                    for node in ast.walk(handler)
                    if isinstance(node, ast.Call)
                    and isinstance(node.func, ast.Attribute)
                    and node.func.attr == "exception"
                ]
                self.assertEqual(
                    len(diagnostic_calls),
                    1,
                    f"{relative_path}:{handler.lineno} must log the exception once",
                )
                message = diagnostic_calls[0].args[0]
                self.assertIsInstance(
                    message,
                    ast.Constant,
                    f"{relative_path}:{handler.lineno} must use a fixed log message",
                )

    def test_exception_objects_are_not_returned_or_yielded_to_clients(self):
        for relative_path in PYTHON_SERVICES:
            tree = ast.parse((REPOSITORY_ROOT / relative_path).read_text())

            for handler in broad_exception_handlers(tree):
                if not handler.name:
                    continue

                for node in ast.walk(handler):
                    if not isinstance(node, (ast.Return, ast.Yield)):
                        continue

                    client_expression = node.value
                    if client_expression is None:
                        continue

                    exposed = any(
                        isinstance(child, ast.Name) and child.id == handler.name
                        for child in ast.walk(client_expression)
                    )
                    self.assertFalse(
                        exposed,
                        f"{relative_path}:{node.lineno} exposes exception details",
                    )

    def test_log_calls_do_not_interpolate_runtime_values(self):
        for relative_path in PYTHON_SERVICES:
            tree = ast.parse((REPOSITORY_ROOT / relative_path).read_text())

            for node in ast.walk(tree):
                if (
                    not isinstance(node, ast.Call)
                    or not isinstance(node.func, ast.Attribute)
                    or node.func.attr
                    not in {"debug", "info", "warning", "error", "critical", "exception"}
                    or not node.args
                ):
                    continue

                self.assertNotIsInstance(
                    node.args[0],
                    ast.JoinedStr,
                    f"{relative_path}:{node.lineno} interpolates data into a log message",
                )


if __name__ == "__main__":
    unittest.main()
