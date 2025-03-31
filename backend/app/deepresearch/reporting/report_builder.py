from typing import List, Literal
import os
from datetime import datetime
from app.deepresearch.core.gpt_engine import llm_call
from app.deepresearch.prompts.system_prompt import system_prompt
from app.deepresearch.prompts.report_prompts import generate_legal_prompt, generate_tax_prompt

def save_report(report: str, report_type: str = "legal") -> str:
    """보고서를 output 폴더에 저장합니다."""
    # app/deepresearch/output 디렉토리 경로 설정
    output_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "output")
    
    # output 디렉토리가 없으면 생성
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # 파일명 생성 (timestamp_type.md)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = os.path.join(output_dir, f"{timestamp}_{report_type}_report.md")
    
    # 보고서 저장
    with open(filename, "w", encoding="utf-8") as f:
        f.write(report)
    
    return filename

def write_final_report(
    prompt: str,
    learnings: List[str],
    visited_urls: List[str],
    client,
    model: str,
    report_type: Literal["legal", "tax"] = "legal",
) -> str:
    """
    모든 연구 결과를 바탕으로 최종 보고서를 생성하고 저장합니다.
    """
    learnings_string = "\n".join([f"- {learning}" for learning in learnings])[:150000]

    # 프롬프트 선택
    if report_type == "legal":
        user_prompt = generate_legal_prompt(prompt, learnings_string)
    else:
        user_prompt = generate_tax_prompt(prompt, learnings_string)

    sys_prompt = system_prompt()
    if sys_prompt:
        user_prompt = f"{sys_prompt}\n\n{user_prompt}"

    try:
        report = llm_call(user_prompt, model, client)
        urls_section = ""
        if visited_urls:
            urls_section = "\n\n## 참고 출처\n" + "\n".join(f"- {url}" for url in visited_urls)

        additional_notice = ""
        if report_type == "legal":
            additional_notice = "\n\n> ⚠️ 본 리포트는 참고용입니다. 실제 법적 대응 시 전문가 상담을 권장합니다."
        else:
            additional_notice = "\n\n> ℹ️ 이 리포트는 참고용으로 제공되며, 복잡한 세무 상황은 전문가 상담을 권장합니다."

        final_report = report.strip() + urls_section + additional_notice
        
        # 보고서 저장
        saved_path = save_report(final_report, report_type)
        print(f"보고서가 저장되었습니다: {saved_path}")
        
        return final_report

    except Exception as e:
        print(f"❌ 보고서 생성 중 오류 발생: {e}")
        return "Error generating report"
