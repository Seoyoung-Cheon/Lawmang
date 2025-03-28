from typing import List, Optional
from app.deepresearch.core.firecrawl_client import firecrawl_search, filter_by_whitelist
from app.deepresearch.research.search_result_processor import process_serp_result
from app.deepresearch.research.keyword_generator import generate_serp_queries
from app.deepresearch.research.research_models import ResearchResult
from openai import OpenAI

async def deep_research(
    query: str,
    breadth: int,
    depth: int,
    client: OpenAI,
    model: str,
    learnings: Optional[List[str]] = None,
    visited_urls: Optional[List[str]] = None,
) -> ResearchResult:
    learnings = learnings or []
    visited_urls = visited_urls or []

    serp_queries = await generate_serp_queries(
        query=query,
        client=client,
        model=model,
        num_queries=breadth,
        learnings=learnings
    )

    for serp_query in serp_queries:
        raw_results = await firecrawl_search(serp_query.query)
        results = filter_by_whitelist(raw_results)
        new_urls = [r.url for r in results]

        serp_result = await process_serp_result(
            query=serp_query.query,
            search_result=results,
            client=client,
            model=model,
            num_learnings=breadth
        )

        all_learnings = learnings + serp_result["learnings"]
        all_urls = visited_urls + new_urls

        if depth > 1:
            next_query = f"이전 목표: {serp_query.research_goal}\n후속 방향: {' '.join(serp_result['followUpQuestions'])}"
            sub_result = await deep_research(
                query=next_query,
                breadth=max(1, breadth // 2),
                depth=depth - 1,
                client=client,
                model=model,
                learnings=all_learnings,
                visited_urls=all_urls
            )
            learnings = sub_result.learnings
            visited_urls = sub_result.visited_urls
        else:
            learnings = all_learnings
            visited_urls = all_urls

    return ResearchResult(
        learnings=list(set(learnings)),
        visited_urls=list(set(visited_urls))
    )
