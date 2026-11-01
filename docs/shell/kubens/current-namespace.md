---
title: "今のコンテキストの名前空間を取り出し、無ければ default にする"
description: "kubectl の設定から、現在のコンテキストに結び付いた名前空間を取り出す関数。設定が空なら default を返す。"
language: shell
project: "kubens"
repo: https://github.com/ahmetb/kubectx
license: "Apache-2.0"
copyright: "Copyright 2017 Google LLC"
commit: "12ad6fb22e8c546ee2b54e7de38aa51c906832f7"
file: "kubens"
lines: [54, 66]
function: "current_namespace"
difficulty: 2
format: 2
tags: [API設計, 文字列処理, イディオム]
---
## ひとことで

`current_namespace` は、今使っている Kubernetes の **名前空間（namespace）** の名前を表示する関数です。名前空間は、クラスタの中でリソースを区切る単位です。

名前空間が設定されていないコンテキストでは、Kubernetes の既定の名前である `default` を使います。この関数は、その既定値も含めて、必ず名前を返すようにしています。

## コード

```bash:line-numbers=54
current_namespace() {
  local cur_ctx

  cur_ctx="$(current_context)" || exit_err "error getting current context"
  ns="$($KUBECTL config view -o=jsonpath="{.contexts[?(@.name==\"${cur_ctx}\")].context.namespace}")" \
     || exit_err "error getting current namespace"

  if [[ -z "${ns}" ]]; then
    echo "default"
  else
    echo "${ns}"
  fi
}
```

## 前提知識

- **名前空間（namespace）**: Kubernetes で、リソースの置き場所を分ける単位です。同じ名前のリソースでも、名前空間が違えば共存できます。
- **`kubectl config view -o=jsonpath=...`**: kubectl の設定を、JSON のパスで指定して取り出します。
- **JSONPath の書き方**: `{.contexts[?(@.name==...)]...}` のように、条件に合う要素を取り出す書き方です。
- **`$KUBECTL`**: kubectl の場所を表す変数です。テストや別の実行ファイルに差し替えられるようにしています。
- **`exit_err`**: エラーを出して終了する関数です。

## 何をしているか

### 1. 今のコンテキストを確かめる

```bash:line-numbers=57
  cur_ctx="$(current_context)" || exit_err "error getting current context"
```

`current_context` で、今のコンテキストの名前を取り出します。取れなければ、エラーで終わります。

### 2. 名前空間を取り出す

```bash:line-numbers=58
  ns="$($KUBECTL config view -o=jsonpath="{.contexts[?(@.name==\"${cur_ctx}\")].context.namespace}")" \
     || exit_err "error getting current namespace"
```

kubectl の設定から、その名前のコンテキストに結び付いた名前空間を、JSONPath で取り出します。

### 3. 空なら default を返す

```bash:line-numbers=61
  if [[ -z "${ns}" ]]; then
    echo "default"
  else
    echo "${ns}"
  fi
```

名前空間が空なら `default` を、そうでなければ取り出した名前を表示します。

## ここがすごい

- **既定値で必ず答えを返す**: 名前空間が無いコンテキストでも、呼ぶ側は必ず名前を受け取れます。空の扱いを、この関数の中で済ませています。
- **設定を直接読む**: 別のファイルを自分で解析せず、kubectl に取り出させています。設定の形式が変わっても、kubectl が合わせてくれます。
- **条件つきの取り出し**: JSONPath の条件で、今のコンテキストに当てはまる項目だけを選んでいます。

## まとめ

- 既定値を決めておくと、空の値を呼ぶ側で扱わずに済む。
- 設定の解析は、公式のツールに任せると確実。
- 条件つきで取り出す書き方を知っていると、設定の中から必要な部分だけを得られる。
