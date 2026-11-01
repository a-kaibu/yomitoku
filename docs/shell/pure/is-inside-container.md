---
title: "コンテナの中かどうかを、ファイルの存在で見分ける"
description: "Docker、Podman、systemd-nspawn、Kubernetes など、コンテナの中で動いているかを、目印のファイルや環境変数から判定する関数。"
language: shell
project: "Pure"
repo: https://github.com/sindresorhus/pure
license: "MIT"
copyright: "Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)"
commit: "cac55d0b531a0db72294c9bba9453dfa6374c59d"
file: "pure.zsh"
lines: [1010, 1024]
function: "prompt_pure_is_inside_container"
difficulty: 2
format: 2
tags: [移植性, イディオム, CLI]
---
## ひとことで

`prompt_pure_is_inside_container` は、今のシェルが **コンテナ（隔離された環境）の中で動いているかどうか** を判定する関数です。コンテナの中なら成功、そうでなければ失敗を返します。

Pure は、実行環境によって動きを変える場合があります。そのため、コンテナの中かどうかを判定する手段が必要になります。この関数は、目印を一つずつ確かめます。

## コード

```zsh:line-numbers=1010
prompt_pure_is_inside_container() {
	local -r nspawn_file='/run/host/container-manager'
	local -r podman_crio_file='/run/.containerenv'
	local -r docker_file='/.dockerenv'
	local -r k8s_token_file='/var/run/secrets/kubernetes.io/serviceaccount/token'
	local -r cgroup_file='/proc/1/cgroup'
	[[ "$container" == "lxc" ]] \
		|| [[ "$container" == "oci" ]] \
		|| [[ "$container" == "podman" ]] \
		|| [[ -r "$nspawn_file" ]] \
		|| [[ -r "$podman_crio_file" ]] \
		|| [[ -r "$docker_file" ]] \
		|| [[ -r "$k8s_token_file" ]] \
		|| [[ -r "$cgroup_file" && "$(< $cgroup_file)" = *(lxc|docker|containerd)* ]]
}
```

## 前提知識

- **コンテナ**: 1 台のコンピュータの中で、独立した環境を作る仕組みです。Docker や Podman、Kubernetes の Pod などが使います。
- **目印のファイル**: コンテナの中にだけ存在する特定のファイルがあることを、コンテナであることの証拠として使います。
- **`local -r`**: 読み取り専用のローカル変数を作ります。値を後から変えられないようにします。
- **`[[ -r ファイル ]]`**: そのファイルが存在して、読めるかを調べます。
- **`$(< ファイル)`**: ファイルの中身を読み込みます。`cat` を使わずに読める zsh の書き方です。
- **`*(lxc|docker|containerd)*`**: 文字列の中に、いずれかの語が含まれているかを調べるパターンです。

## 何をしているか

### 1. 目印の場所を用意する

```zsh:line-numbers=1011
	local -r nspawn_file='/run/host/container-manager'
	local -r podman_crio_file='/run/.containerenv'
	local -r docker_file='/.dockerenv'
	local -r k8s_token_file='/var/run/secrets/kubernetes.io/serviceaccount/token'
	local -r cgroup_file='/proc/1/cgroup'
```

コンテナを見分けるためのファイルの場所を、読み取り専用の変数に入れておきます。

### 2. 環境変数で判定する

```zsh:line-numbers=1016
	[[ "$container" == "lxc" ]] \
		|| [[ "$container" == "oci" ]] \
		|| [[ "$container" == "podman" ]] \
```

`container` という環境変数が `lxc`、`oci`、`podman` のどれかなら、コンテナの中だと判定します。

### 3. ファイルの有無で判定する

```zsh:line-numbers=1019
		|| [[ -r "$nspawn_file" ]] \
		|| [[ -r "$podman_crio_file" ]] \
		|| [[ -r "$docker_file" ]] \
		|| [[ -r "$k8s_token_file" ]] \
```

systemd-nspawn、Podman、Docker、Kubernetes の、それぞれ特有のファイルがあれば、コンテナの中だと判定します。

### 4. cgroup の内容で判定する

```zsh:line-numbers=1023
		|| [[ -r "$cgroup_file" && "$(< $cgroup_file)" = *(lxc|docker|containerd)* ]]
```

最後に、`/proc/1/cgroup` の中身に、コンテナ関連の名前が含まれるかを調べます。これは、上の目印がどれも無い場合の最後の手段です。

どれか 1 つでも当てはまれば、`||` の連鎖によって成功になります。

## ここがすごい

- **複数の目印を組み合わせる**: どのコンテナ技術にも、必ず同じ目印があるわけではありません。そこで、複数の方法を順番に確かめています。
- **条件を `||` でつなぐ**: 最初に真になった時点で判定が終わるので、無駄な確認をしません。
- **外部コマンドを使わない**: `cat` や `grep` を呼ばずに、テストと変数だけで判定しています。プロンプトの表示は頻繁に行われるので、この軽さが大切です。

## まとめ

- 実行環境の判定は、特有の目印を複数用意して確かめる。
- 判定の条件は `||` でつなぐと、早く終わる。
- 表示の処理を軽くするために、外部コマンドを避ける。
