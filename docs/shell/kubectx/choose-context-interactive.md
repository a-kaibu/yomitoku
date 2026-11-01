---
title: "fzf で Kubernetes のコンテキストを選んで切り替える"
description: "fzf に候補の一覧を渡して、ユーザーが選んだコンテキストへ切り替える関数。候補は自分自身のコマンドで作り、色は強制的に有効にする。"
language: shell
project: "kubectx"
repo: https://github.com/ahmetb/kubectx
license: "Apache-2.0"
copyright: "Copyright 2017 Google LLC"
commit: "12ad6fb22e8c546ee2b54e7de38aa51c906832f7"
file: "kubectx"
lines: [118, 129]
function: "choose_context_interactive"
difficulty: 2
format: 2
tags: [CLI, 設計パターン, イディオム]
---
## ひとことで

`choose_context_interactive` は、**fzf の画面で Kubernetes のコンテキスト（接続先の設定）を 1 つ選ばせ**、選んだものへ切り替える関数です。引数なしで `kubectx` と打ったときに、この画面が開きます。

Kubernetes の接続先は、複数登録して使い分けるのが普通です。名前を覚えて打つ代わりに、一覧から矢印キーで選べるようにするのが、この関数の狙いです。

## コード

```bash:line-numbers=118
choose_context_interactive() {
  local choice
  choice="$(_KUBECTX_FORCE_COLOR=1 \
    FZF_DEFAULT_COMMAND="${SELF_CMD}" \
    fzf --ansi --no-preview || true)"
  if [[ -z "${choice}" ]]; then
    echo 2>&1 "error: you did not choose any of the options"
    exit 1
  else
    set_context "${choice}"
  fi
}
```

## 前提知識

- **コンテキスト**: kubectl が接続先のクラスタ、ユーザー、名前空間の組み合わせを表す設定の単位です。`kubectl config use-context` で切り替えます。
- **fzf**: 候補の一覧から、キーボードで素早く選べる対話的なツールです。
- **`choice="$(...)"`**: コマンドの出力を変数に入れます。ここでは、fzf で選んだ 1 行が入ります。
- **`|| true`**: 直前のコマンドが失敗しても、全体を成功として扱います。fzf はキャンセルすると失敗するので、この書き方で止まらないようにしています。
- **`_KUBECTX_FORCE_COLOR=1`**: この 1 回の実行だけ、色を強制的に有効にする環境変数です。

## 何をしているか

### 1. fzf を開いて選ばせる

```bash:line-numbers=120
  choice="$(_KUBECTX_FORCE_COLOR=1 \
    FZF_DEFAULT_COMMAND="${SELF_CMD}" \
    fzf --ansi --no-preview || true)"
```

環境変数を付けて fzf を起動します。候補の一覧は `SELF_CMD`（自分自身のコマンド）が出し、`--ansi` で色を表示します。選んだ結果を `choice` に入れます。

### 2. 何も選ばれなければ終わる

```bash:line-numbers=123
  if [[ -z "${choice}" ]]; then
    echo 2>&1 "error: you did not choose any of the options"
    exit 1
```

キャンセルなどで何も選ばれなかったら、エラーを出して終了します。

### 3. 選ばれたら切り替える

```bash:line-numbers=126
  else
    set_context "${choice}"
  fi
```

選ばれたコンテキストを、`set_context` に渡して切り替えます。

## ここがすごい

- **自分自身を候補の生成に使う**: 候補の一覧を別の仕組みで作らず、自分のコマンドを呼ぶことで、表示の内容と切り替えの処理を同じ場所で扱えます。
- **キャンセルを正しく扱う**: fzf のキャンセルを失敗とみなさず、「何も選ばれなかった」として明確に扱っています。
- **色を強制する理由**: 候補を fzf に渡すとき、パイプの先では色が自動で消えてしまいます。環境変数で、色の表示を保っています。

## まとめ

- 対話的な選択は、外部の選択ツールに任せると操作が速くなる。
- 選択ツールのキャンセルは、エラーと区別して扱う。
- 色のような表示の設定は、環境変数で一時的に指定できる。
