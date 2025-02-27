@tool
def python_tool(input_text: str, policy_list: list, ally: CustomConnection) -> object:
    client = AzureOpenAI(
        azure_endpoint=ally.openai_endpoint,
        api_key=ally.openai_key,
        api_version=ally.openai_api_version,
    )
    # summarize the document provided by the user, the summary will be only on the policy items provided. Return the analysis in the following JSON format, the format is as follows:
    prompt = """
    This is the list of steps to follow to summarize the document provided by the user:
    1. Summarize the document provided by the user
    2. The summary will be only on the policy items provided in the list and will only summarize text with to compare with the policy items provided in the list
    3. compare field will be the summary of the relevant policy item and the text provided for the comparison and emphasis on the compare
    4. original_text field will be the original text from the document with no changes or eddits
    5. all of the text will be in English
    6. Return the output in the following JSON format, the format is as follows: {"PolicyItems": [
    {"title": "Policy Title", 
     "summary": "Short Policy Summary based on Documnet only", 
     "compare": "Summary of the relevant policy item and the text provided for the comparison and emphasis on the compare", 
     "original_text": "Original text from the document with no changes or eddits",
     "original_policy": "Original policy from the document with no changes or eddits",
     "keyItems":"key Items from the document on this policy, importent key points like numbers, dates, and names", 
     "iscompliant": "yes/no"
     }]}
    7. Compare the document with the policy items provided in the list and if the policy is been breached note it under the iscompliant field
    8. original_policy field will be the original policy from the document with no changes or eddits
    9. The policy items provided in the list are:
            """ + str(policy_list)
    openai_response = client.beta.chat.completions.parse(
        model=ally.openai_model_deployment,
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": str(input_text)},
        ],
        response_format=SummaryResponse,
    )
    try:
        openai_sentiment_response_post_text = openai_response.choices[0].message.parsed
        response = json.loads(
            openai_sentiment_response_post_text.model_dump_json(indent=2)
        )
        print(response)
    except Exception as e:
        print(f"Error converting to JSON sentiment from OpenAI: {e}")
        return

    return response
