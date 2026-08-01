# WyberCode inference VM

The missing half of `src/lib/model-providers/wybercode.ts`: a real, self-hosted,
OpenAI-compatible inference endpoint. Everything in the main app (retrieve-then-patch
routing, shadow-mode comparison, gradual rollout gating) already expects this contract —
this directory is just the GPU box that finally answers it.

**Status: not yet deployed.** Blocked on GPU quota — `NVIDIA_L4_GPUS` is 0 in every
region on the `wyberai` project. Request an increase to 1 in **us-east4** (GCP Console →
Quotas → filter `NVIDIA L4 GPUs` → region `us-east4` → Increase Requests) before running
`deploy.sh`. Chosen over us-central1/India: same price as us-central1, and us-east4 is in
Virginia — same region as the Vercel app (`iad1`), so no cross-country/cross-ocean latency
added to every generation call.

## What this deploys

One `g2-standard-4` VM (1× NVIDIA L4, 4 vCPU, 16GB RAM) in `us-east4-a`, running
[vLLM](https://github.com/vllm-project/vllm)'s OpenAI-compatible server via Docker, serving
**Qwen2.5-Coder-14B-Instruct-AWQ** (4-bit quantized — fits comfortably in the L4's 24GB
VRAM with room for real concurrency, unlike an unquantized 14B or a quantized 32B).

One model answers to BOTH `wybercode-patch` and `wybercode-fullgen` model names
(`--served-model-name`), matching `wybercode.ts`'s existing `PATCH_MODEL_ID`/
`FULLGEN_MODEL_ID` defaults exactly — so `WYBERCODE_PATCH_INFERENCE_URL` and
`WYBERCODE_FULLGEN_INFERENCE_URL` can both point at this same VM to start. Splitting into
two genuinely different models/VMs (a smaller one for patches, a bigger one for full-gen)
is a later optimization once shadow-mode data says it's worth the extra cost — not needed
to validate the pipeline.

Chose one mid-size model over a bigger one on purpose: the goal right now is validating
whether self-hosting is viable at all (via shadow mode — zero user-facing risk), not
shipping the best possible model on day one. Qwen2.5-Coder is a genuinely strong,
apache-2.0-licensed coding model family with native tool-calling support, which
`wybercode.ts`'s `write_file`/`edit_file` function-calling contract requires.

## Deploy (once quota is approved)

```bash
export WYBERCODE_INFERENCE_SECRET=$(openssl rand -hex 32)   # save this, you'll need it below
cd gcp-bridge/wybercode-inference
./deploy.sh
```

First boot takes several minutes — it's pulling the vLLM Docker image AND downloading the
~9GB quantized model weights from Hugging Face before the server can answer requests.
Check progress with:

```bash
gcloud compute instances get-serial-port-output wybercode-inference-1 --zone=us-east4-a | tail -50
```

Once it's up, get the VM's IP and wire it into Vercel (Production env vars — start with
Preview only if you want to test before it's live):

```
WYBERCODE_INFERENCE_URL=http://<VM_IP>:8000
WYBERCODE_INFERENCE_SECRET=<the secret you generated above>
WYBERCODE_SHADOW_MODE=true
```

**Do NOT set `WYBERCODE_ENABLED=true` yet.** That's the switch that routes real user
builds to this. `WYBERCODE_SHADOW_MODE=true` is the safe one — it replays already-served
Claude turns through this endpoint in the background, logs comparison rows to
`generation_usage_log`/`wybercode_shadow_runs`, and never shows a user anything from it.
Let that run for a while and look at the data before touching `WYBERCODE_ENABLED`.

## Cost control

This VM bills whether it's serving traffic or not (~$0.70/hr, ~$500/mo if left running
24/7). While validating, stop it between test sessions:

```bash
gcloud compute instances stop wybercode-inference-1 --zone=us-east4-a
gcloud compute instances start wybercode-inference-1 --zone=us-east4-a   # ~2-3 min to be ready again (model reloads)
```

## Teardown

```bash
gcloud compute instances delete wybercode-inference-1 --zone=us-east4-a
gcloud compute firewall-rules delete wybercode-inference-allow-8000
```
