---
title: "ローカルのファイルを指す URI かどうかを判定する"
description: "画像の場所を表す URI が、端末の中のファイルを指しているかを判定する isFileUri。スキームがないか file で、パスがあり、アセットではないものを対象にする。"
language: kotlin
project: "Coil"
repo: https://github.com/coil-kt/coil
license: Apache-2.0
copyright: "Copyright 2026 Coil Contributors"
commit: "bba95eda4f78a97312eab08eb5f3613d7f89b4fb"
file: coil-core/src/commonMain/kotlin/coil3/util/utils.kt
lines: [102, 105]
function: "isFileUri"
difficulty: 2
tags: [パース, 型システム, 防御的プログラミング]
format: 2
---

## ひとことで

`isFileUri` は、画像などの場所を表す `Uri` が **端末の中のファイルを指しているかどうか** を判定する関数です。`file://` で始まるもの、またはスキームがないもので、パスがあり、アセットではないものを対象にします。

Coil は、ネットワーク、ファイル、アプリ内のアセットなど、さまざまな場所から画像を読み込みます。どの読み込み方を使うかを決めるために、この判定を使っています。

## コード

```kotlin:line-numbers=102
internal fun isFileUri(uri: Uri): Boolean {
    return (uri.scheme == null || uri.scheme == SCHEME_FILE) &&
        uri.path != null && !isAssetUri(uri)
}
```

## 前提知識

- **URI**: インターネットや端末の中の資源の場所を表す文字列の形式です。`https://example.com/a.png` や `file:///sdcard/a.png` のような形をしています。
- **スキーム**: URI の先頭にある、どの種類の場所かを表す部分です。`https`、`file` などがあります。スキームがない URI も、ここでは相対的なファイルとして扱われます。
- **パス（path）**: URI の中の、場所を示す部分です。
- **`SCHEME_FILE`**: `"file"` という文字列を表す定数です。
- **`isAssetUri`**: アプリに同梱されたアセットかどうかを調べる関数です。プラットフォームごとに実装が分かれているので、`expect` で宣言されています。

## 何をしているか

### 1. スキームの条件

```kotlin:line-numbers=103
    return (uri.scheme == null || uri.scheme == SCHEME_FILE) &&
```

スキームがないか、スキームが `file` のどちらかであることを確かめます。ネットワークの URI（`https` など）はここで外れます。

### 2. パスがあり、アセットではない

```kotlin:line-numbers=104
        uri.path != null && !isAssetUri(uri)
```

パスがあることを確かめ、さらにアセットの URI でないことも確かめます。アセットは、ファイルの場所としては扱わず、別の読み込み方で処理するからです。

## ここがすごい

- **条件を組み合わせて 1 つの判定にする**: 3 つの条件を `&&` でつないで、「ローカルのファイルとして読むべきか」を 1 つの式で表しています。
- **`null` を先に確かめる**: `uri.scheme` や `uri.path` は `null` になることがあります。`null` を先に確かめてから比べることで、安全に判定できます。
- **アセットを除外する**: 同じ `file` のスキームでも、アセットは別の経路で読みます。その違いを、プラットフォームの関数に任せて、ここでは呼ぶだけにしています。
- **判定の結果が使い道を決める**: この判定は、キャッシュの鍵を作るときや、読み込みの方法を選ぶときに使われます。判定を 1 か所に集めると、どこでも同じ基準になります。

## まとめ

- URI の種類は、スキームとパスを確かめると判定できる。
- `null` になりうる値は、比べる前に確かめる。
- 例外的な扱い（アセット）は、判定の中で明示的に除くと、読み込みの経路が混ざらない。
