import os
import subprocess
import yaml
from typing import Any, Literal


def git_root() -> str:
    return (
        subprocess.Popen(["git", "rev-parse", "--show-toplevel"], stdout=subprocess.PIPE)
        .communicate()[0]
        .rstrip()
        .decode("utf-8")
    )


REPO_ROOT: str = git_root()
LOCAL_CONFIG_FILE: str = os.path.join(REPO_ROOT, "backend", "config.yaml")


class Config:
    def __init__(self, config_file: str = LOCAL_CONFIG_FILE) -> None:
        with open(config_file, "r") as f:
            self.config: dict[str, Any] = yaml.safe_load(f)

    def get_connection_arg(self, connection_type: Literal["common_model"], arg: str) -> Any:
        connections: dict[str, dict[str, Any]] = self.config["connections"]
        if connection_type not in connections:
            raise KeyError(f"Cannot find connection type `{connection_type}` in the config file")
        connection_config: dict[str, Any] = connections[connection_type]
        if arg not in connection_config:
            raise KeyError(
                f"Cannot find argument `{arg}` in connection type "
                f"`{connection_type}` in the config file"
            )
        return connection_config[arg]
