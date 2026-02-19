
import logging
import json
import httpx
from typing import Dict, Any
from database import supabase

logger = logging.getLogger(__name__)

class WebhookService:
    async def dispatch_event(self, event_name: str, payload: Dict[str, Any]):
        """Find active webhooks and dispatch event payload"""
        try:
            # 1. Fetch integrations
            # Filter by type='webhook' and status='connected'
            # Note: config is JSONB. We check if event_name is in config['events']?
            # Or just send to all webhooks? Usually specific events.
            response = supabase.table("integrations").select("*").eq("type", "webhook").eq("status", "connected").execute()
            integrations = response.data
            
            if not integrations:
                return

            for integration in integrations:
                config = integration.get("config", {})
                if isinstance(config, str):
                    try: config = json.loads(config)
                    except: config = {}
                
                # Check subscription
                subscribed_events = config.get("events", [])
                if event_name in subscribed_events or "*" in subscribed_events:
                    target_url = config.get("url")
                    if target_url:
                        await self._send_webhook(integration["id"], target_url, event_name, payload)

        except Exception as e:
            logger.error(f"Webhook dispatch error: {e}")

    async def _send_webhook(self, integration_id: str, url: str, event_name: str, payload: Dict[str, Any]):
        """Send HTTP POST and log result"""
        log_entry = {
            "integration_id": integration_id,
            "event_name": event_name,
            "payload": payload,
            "status": "pending"
        }
        
        # Initial Log (Optional, maybe skip pending)
        # log_res = supabase.table("integration_logs").insert(log_entry).execute()
        # log_id = log_res.data[0]['id']
        
        status = "failed"
        response_status = 0
        response_body = ""

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, json=payload)
                response_status = response.status_code
                response_body = response.text[:1000] # Truncate check
                
                if response.is_success:
                    status = "success"
                else:
                    status = "failed"
                    
        except Exception as e:
            response_body = str(e)
            status = "failed"
        
        # Log Result (Final)
        final_log = {
            "integration_id": integration_id,
            "event_name": event_name,
            "payload": payload,
            "response_status": response_status,
            "response_body": response_body,
            "status": status
        }
        try:
            supabase.table("integration_logs").insert(final_log).execute()
        except Exception as e:
            logger.error(f"Failed to save webhook log: {e}")

webhook_service = WebhookService()
