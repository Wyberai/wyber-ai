#!/bin/bash
# Creates the WyberCode inference VM + a firewall rule scoped to it.
# Prereq: NVIDIA_L4_GPUS quota approved for us-east4 on the wyberai project
# (Console → Quotas → filter "NVIDIA L4 GPUs" → region us-east4). Running this
# before quota is approved will fail with a clear "quota exceeded" error, not
# silently do the wrong thing.
set -euo pipefail

PROJECT=wyberai
ZONE=us-east4-a
INSTANCE=wybercode-inference-1
MACHINE_TYPE=g2-standard-4   # 4 vCPU / 16GB RAM + 1x L4 — start small, resize once shadow-mode data says it's worth more
FIREWALL_RULE=wybercode-inference-allow-8000

: "${WYBERCODE_INFERENCE_SECRET:?Set WYBERCODE_INFERENCE_SECRET first, e.g. export WYBERCODE_INFERENCE_SECRET=\$(openssl rand -hex 32)}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "== Creating firewall rule (idempotent — skips if it already exists) =="
gcloud compute firewall-rules describe "$FIREWALL_RULE" --project="$PROJECT" >/dev/null 2>&1 || \
gcloud compute firewall-rules create "$FIREWALL_RULE" \
  --project="$PROJECT" \
  --network=default \
  --direction=INGRESS \
  --action=ALLOW \
  --rules=tcp:8000 \
  --target-tags=wybercode-inference \
  --source-ranges=0.0.0.0/0
  # Wide open on the network layer, same discipline as gcp-bridge's Cloud Run
  # service: Vercel has no static egress IP to allowlist, so the real gate is
  # the --api-key bearer check inside vLLM itself (startup-script.sh) — anyone
  # without WYBERCODE_INFERENCE_SECRET gets a 401 from vLLM regardless of
  # network reachability.

echo "== Creating the VM =="
gcloud compute instances create "$INSTANCE" \
  --project="$PROJECT" \
  --zone="$ZONE" \
  --machine-type="$MACHINE_TYPE" \
  --accelerator="type=nvidia-l4,count=1" \
  --maintenance-policy=TERMINATE \
  --image-family=common-cu124-debian-11 \
  --image-project=deeplearning-platform-release \
  --boot-disk-size=100GB \
  --boot-disk-type=pd-ssd \
  --metadata-from-file=startup-script="$SCRIPT_DIR/startup-script.sh" \
  --metadata=bearer-secret="$WYBERCODE_INFERENCE_SECRET" \
  --tags=wybercode-inference

IP=$(gcloud compute instances describe "$INSTANCE" --project="$PROJECT" --zone="$ZONE" \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

cat <<EOF

VM created at $IP — still booting (pulling the vLLM image + downloading model
weights takes several minutes). Watch progress with:
  gcloud compute instances get-serial-port-output $INSTANCE --zone=$ZONE | tail -50

Once it's answering, set these in Vercel (Production):
  WYBERCODE_INFERENCE_URL=http://$IP:8000
  WYBERCODE_INFERENCE_SECRET=$WYBERCODE_INFERENCE_SECRET
  WYBERCODE_SHADOW_MODE=true

Do NOT set WYBERCODE_ENABLED=true yet — see README.md.
EOF
