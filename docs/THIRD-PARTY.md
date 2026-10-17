# Third-party components

## fflate 0.8.3

The standalone HTML embeds fflate for local ZIP import.

MIT License

Copyright (c) 2026 Arjun Barrett

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## AI SDK

Backend dependency `ai` and its transitive dependencies are installed through npm and retain their respective licenses. See package-lock.json and each package license.

## Local speech recognition

The optional browser speech module distributes Transformers.js 3.8.1 (Apache-2.0), ONNX Runtime Web (MIT), and multilingual Whisper tiny quantized weights (MIT). Their complete notices are retained in `public/speech/v1/licenses/`. Transformers.js bundles its browser dependencies; source and release details: https://github.com/huggingface/transformers.js/tree/3.8.1 and https://github.com/microsoft/onnxruntime.

The Whisper weights are from https://huggingface.co/onnx-community/whisper-tiny at revision `ff4177021cc41f7db950912b73ea4fdf7d01d8e7`, derived from OpenAI Whisper: https://github.com/openai/whisper. Asset paths, byte counts, and SHA-256 hashes are recorded in `public/speech/v1/manifest.json`.
