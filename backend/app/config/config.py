import os
import sys


def root_dir():
    """프로젝트 루트 디렉토리 및 설정 파일 경로를 반환하는 함수"""
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    config_path = os.path.join(root, "configuration.conf")

    print(f" {root}")

    return root, config_path


# 함수 실행 후, 전역 변수로 설정
ROOT_DIR, CONFIG_PATH = root_dir()

# 파이썬 모듈 검색 경로에 프로젝트 루트 추가
sys.path.append(ROOT_DIR)
