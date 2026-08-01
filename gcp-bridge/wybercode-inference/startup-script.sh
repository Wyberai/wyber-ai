#!/bin/bash
# Runs automatically on first boot (GCE startup-script metadata). Installs
# Docker if the base image doesn't already have it, then launches vLLM's
# OpenAI-compatible server serving Qwen2.5-Coder-14B-Instruct-AWQ under both
# the "wybercode-patch" and "wybercode-fullgen" served names — see README.md
# for why one model covers both tiers for now.
set -euo pipefail

if ! command -v docker >/dev/null 2>&1; then
  apt-get update -y
  apt-get install -y docker.io
  systemctl enable docker
  systemctl start docker
fi

# Passed in via `gcloud compute instances create --metadata=bearer-secret=...`
# — this VM's own copy of WYBERCODE_INFERENCE_SECRET, read from GCE's instance
# metadata server rather than baked into the image or this script.
BEARER_SECRET=$(curl -s -H "Metadata-Flavor: Google" \
  "http://metadata.google.internal/computeMetadata/v1/instance/attributes/bearer-secret")

docker rm -f vllm-wybercode 2>/dev/null || true

docker run -d --restart=always --gpus all \
  -p 8000:8000 \
  --name vllm-wybercode \
  vllm/vllm-openai:latest \
  --model Qwen/Qwen2.5-Coder-14B-Instruct-AWQ \
  --quantization awq \
  --max-model-len 16384 \
  --served-model-name wybercode-patch wybercode-fullgen \
  --enable-auto-tool-choice \
  --tool-call-parser hermes \
  --api-key "$BEARER_SECRET"
