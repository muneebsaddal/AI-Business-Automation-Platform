"""Tool registry for executor step lookup."""

from app.tools.contract_tools import (
    extract_dates,
    extract_obligations,
    extract_parties,
    find_missing_fields,
    flag_risks,
)
from app.tools.custom_tools import execute_custom_step, parse_custom_steps
from app.tools.lead_tools import (
    classify_routing,
    extract_company_info,
    extract_intent_signals,
    score_lead,
)
from app.tools.onboarding_tools import (
    parse_onboarding_steps,
    simulate_account_setup,
    simulate_resource_provisioning,
    simulate_welcome_email,
)

TOOL_REGISTRY = {
    "extract_company_info": extract_company_info,
    "extract_intent_signals": extract_intent_signals,
    "score_lead": score_lead,
    "classify_routing": classify_routing,
    "extract_parties": extract_parties,
    "extract_dates": extract_dates,
    "extract_obligations": extract_obligations,
    "flag_risks": flag_risks,
    "find_missing_fields": find_missing_fields,
    "parse_onboarding_steps": parse_onboarding_steps,
    "simulate_account_setup": simulate_account_setup,
    "simulate_welcome_email": simulate_welcome_email,
    "simulate_resource_provisioning": simulate_resource_provisioning,
    "parse_custom_steps": parse_custom_steps,
    "execute_custom_step": execute_custom_step,
}

