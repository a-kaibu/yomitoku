---
title: 「..」と「.」を片付けてパスを整える、スタックの考え方
description: os.path.normpath の POSIX 版（C 実装がないときの Python 版）。パスを / で分けて、. を捨て、.. で 1 つ戻るという処理をリストをスタックとして使って書いている。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/posixpath.py
lines: [345, 371]
function: normpath
difficulty: 2
tags: [文字列処理, ファイル, データ構造, 標準ライブラリ]
---
## ひとことで

`normpath` は、`a//b/./c/../d` のようなごちゃごちゃしたパスを、`a/b/d` のように **整った形に直す** 関数です。
重ねたスラッシュをまとめ、`.`（今のディレクトリ）を消し、`..`（1 つ上）があれば直前の要素を取り消します。
ファイルに実際にアクセスせず、文字列の操作だけで処理します。

## コード

```python:line-numbers=345
    def normpath(path):
        """Normalize path, eliminating double slashes, etc."""
        path = os.fspath(path)
        if isinstance(path, bytes):
            sep = b'/'
            dot = b'.'
            dotdot = b'..'
        else:
            sep = '/'
            dot = '.'
            dotdot = '..'
        if not path:
            return dot
        _, initial_slashes, path = splitroot(path)
        comps = path.split(sep)
        new_comps = []
        for comp in comps:
            if not comp or comp == dot:
                continue
            if (comp != dotdot or (not initial_slashes and not new_comps) or
                 (new_comps and new_comps[-1] == dotdot)):
                new_comps.append(comp)
            elif new_comps:
                new_comps.pop()
        comps = new_comps
        path = initial_slashes + sep.join(comps)
        return path or dot
```

この関数は、C 言語で書かれた高速版が使えないときのための Python 版です（すぐ上の `from posix import _path_normpath as normpath` が `ImportError` で失敗したときだけ定義されます）。

## 前提知識

- **パスの記号**: `/` は区切り、`.` は「今のディレクトリ」、`..` は「1 つ上のディレクトリ」です。先頭が `/` なら絶対パス（ルートから）です。
- **`os.fspath(path)`**: `pathlib.Path` などのパスを表すオブジェクトを、ふつうの文字列（またはバイト列）に変換します。
- **`str` と `bytes`**: Python では文字列（`'abc'`）とバイト列（`b'abc'`）は別の型で、混ぜて使えません。パスはどちらでも渡せるので、区切り文字なども型に合わせて用意しています。
- **`split` と `join`**: `'a/b/c'.split('/')` は `['a', 'b', 'c']`、`'/'.join(['a', 'b'])` は `'a/b'` です。
- **スタック**: 最後に入れたものから取り出すデータ構造です。Python のリストでは `append` で積み、`pop` で最後を取り出します。
- **`splitroot(path)`**: パスを「ドライブ」「先頭のスラッシュ」「残り」の 3 つに分ける関数です。POSIX ではドライブは常に空です。

## 何をしているか

`'/usr//local/./lib/../bin'` で追います。

### 1. 区切り文字を型に合わせる（347〜355 行目）

文字列なら `'/'`, `'.'`, `'..'`、バイト列なら `b'/'` などを使います。

### 2. 先頭のスラッシュを分けて、残りを区切る（356〜359 行目）

空のパスなら `'.'` を返します。`splitroot` で先頭の `'/'` と残りに分け、残りを `/` で区切ると
`['usr', '', 'local', '.', 'lib', '..', 'bin']` になります。

### 3. 1 つずつ積んだり戻したりする（360〜368 行目）

| comp | 処理 | new_comps |
| --- | --- | --- |
| `usr` | 積む | `[usr]` |
| `''` | 捨てる（`//` の間） | `[usr]` |
| `local` | 積む | `[usr, local]` |
| `.` | 捨てる | `[usr, local]` |
| `lib` | 積む | `[usr, local, lib]` |
| `..` | 1 つ戻す（pop） | `[usr, local]` |
| `bin` | 積む | `[usr, local, bin]` |

### 4. 組み立て直す（369〜371 行目）

先頭のスラッシュと `/` でつないで `'/usr/local/bin'` を返します。結果が空なら `'.'` にします。

## ここがすごい

### `..` を積むべき場合を 1 つの条件にまとめた

364〜365 行目の条件は、「`..` 以外」か、次のどちらかなら **積む** という意味です。

- `not initial_slashes and not new_comps`: 相対パスで、まだ何も積んでいない（`../a` の `..` は消せない）
- `new_comps[-1] == dotdot`: 直前も `..`（`../../a` の 2 つ目も消せない）

そうでなく、積んだものがあれば `pop` で取り消します。積んだものがない絶対パスの場合（`/..`）は、ルートより上はないので何もしません。これで `'../../a'` は `'../../a'` のまま、`'/../a'` は `'/a'` になります。

### スタックは「戻る」処理と相性がよい

`..` は「直前に進んだ 1 歩を取り消す」操作です。最後に積んだものを取り出すスタックは、まさにこの動きをそのまま表せます。括弧の対応チェックなどと同じ、スタックの代表的な使い道です。

### 先頭の `//` を保つ

`splitroot` を使って先頭のスラッシュを別に扱うのは、POSIX では「先頭がちょうど 2 個のスラッシュ」が特別な意味を持ちうると規格で決められているためです。中間の `//` はまとめても、先頭の形は勝手に変えません。

## まとめ

- パスの正規化は「区切って、スタックに積んだり戻したりして、つなぎ直す」で書ける。
- `..` を消せない場合（相対パスの先頭、`..` の連続）を条件で正しく扱うのがポイント。
- 文字列とバイト列の両方を受けるなら、記号も型に合わせて用意する。
