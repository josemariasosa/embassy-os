#!/bin/bash

set -e
shopt -s expand_aliases

if [ "$0" != "./build-portable.sh" ]; then
	>&2 echo "Must be run from backend directory"
	exit 1
fi

USE_TTY=
if tty -s; then
	USE_TTY="-it"
fi

alias 'rust-musl-builder'='docker run $USE_TTY --rm -v "$HOME"/.cargo/registry:/root/.cargo/registry -v "$(pwd)":/home/rust/src start9/rust-musl-cross:x86_64-musl'

cd ..
rust-musl-builder sh -c "(cd backend && cargo +beta build --release --target=x86_64-unknown-linux-musl --no-default-features)"
cd backend
