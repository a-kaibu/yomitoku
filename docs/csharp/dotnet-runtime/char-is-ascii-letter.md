---
title: "大文字・小文字の判定を OR 1 回と比較 1 回にまとめる"
description: "char.IsAsciiLetter は、0x20 との OR で大文字を小文字にそろえ、符号なし整数の引き算で「a〜z の範囲内か」を 1 回の比較で判定する。ASCII の表の並びを活かした小技。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Char.cs
lines: [293, 300]
function: "char.IsAsciiLetter"
difficulty: 1
tags: [文字列処理, ビット演算, イディオム]
---

## ひとことで

`char.IsAsciiLetter(c)` は、文字 `c` が **英字（A〜Z または a〜z）** かどうかを返します。
素直に書くと `(c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z')` と 4 回比較しますが、この関数は **OR 1 回・引き算 1 回・比較 1 回** の 1 行です。

## コード

```csharp:line-numbers=293
        /// <summary>Indicates whether a character is categorized as an ASCII letter.</summary>
        /// <param name="c">The character to evaluate.</param>
        /// <returns>true if <paramref name="c"/> is an ASCII letter; otherwise, false.</returns>
        /// <remarks>
        /// This determines whether the character is in the range 'A' through 'Z', inclusive,
        /// or 'a' through 'z', inclusive.
        /// </remarks>
        public static bool IsAsciiLetter(char c) => (uint)((c | 0x20) - 'a') <= 'z' - 'a';
```

## 前提知識

- **`char`**: C# の文字型で、中身は 16 ビットの数（UTF-16 のコード単位）です。`'a'` は 97、`'A'` は 65 という数として計算できます。
- **ASCII の大文字と小文字**: `'A'`（0x41）と `'a'`（0x61）のように、大文字と小文字は **ちょうど 0x20（= 32）だけ離れて** います。2 進数で見ると、違いは 0x20 のビット 1 つだけです。
- **`|`（ビットごとの OR）**: `c | 0x20` は 0x20 のビットを必ず 1 にします。大文字は小文字になり、小文字はそのままです。
- **`=>`（式形式のメンバー）**: `public static bool F(char c) => 式;` は、`{ return 式; }` を短く書いたものです。
- **`(uint)` へのキャスト**: 負の数を `uint`（符号なし整数）として読み直すと、とても大きな正の数になります。

## 何をしているか

`c = 'G'`（0x47）で追います。

1. `c | 0x20` → 0x67 = `'g'`。大文字が小文字になりました。
2. `- 'a'` → 0x67 − 0x61 = 6。`'a'` から何文字目かです。
3. `(uint)6 <= 'z' - 'a'`（= 25）→ **true**。

英字でない文字も見てみます。

- `'5'`（0x35）: `| 0x20` しても 0x35 のまま。`0x35 − 0x61` は負の数 −44 ですが、`(uint)` にすると約 42 億になり、25 より大きいので **false**。
- `'@'`（0x40、`'A'` の 1 つ前）: `| 0x20` で 0x60（`'`'`、`'a'` の 1 つ前）。引くと −1 → `(uint)` で最大値 → **false**。
- `'['`（0x5B、`'Z'` の 1 つ後）: `| 0x20` で 0x7B（`'{'`、`'z'` の 1 つ後）。引くと 26 → **false**。

ASCII の表では、大文字の前後の記号を `| 0x20` すると、ちょうど小文字の前後の記号になります。なので範囲の境界がずれません。

## ここがすごい

- **2 つの範囲を 1 つに重ねる**: `| 0x20` で大文字の範囲を小文字の範囲に重ね合わせ、判定を「a〜z の 1 範囲」だけにしています。
- **「下限以上かつ上限以下」を比較 1 回で**: `(uint)(x - min) <= (max - min)` は、x が min より小さいと引き算が負になり、符号なしでは巨大な数になるので、上限との比較 1 回で両側を確かめられます。この技は同じファイルの `char.IsBetween` にも使われています。
- **分岐がない**: `&&` や `||` を使うと、条件によってジャンプ（分岐）が発生することがあります。この書き方は算術と 1 回の比較だけなので、文字列を大量に処理するときに CPU の分岐予測ミスを起こしません。

## まとめ

- ASCII の大文字と小文字は 0x20 のビット 1 つだけが違う。`| 0x20` で小文字にそろえられる。
- `(uint)(x - min) <= (uint)(max - min)` は範囲判定の定番テクニック。
- 文字コード表の並び方を知っていると、判定をぐっと単純にできる。
