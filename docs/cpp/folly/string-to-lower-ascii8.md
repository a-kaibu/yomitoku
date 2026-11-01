---
title: 分岐なしで大文字を小文字にする、足し算とマスクの 7 ステップ
description: 1 文字を小文字に変える toLowerAscii8。「A〜Z のときだけ最上位ビットが立つ」ように足し算で値をずらし、そのビットを 0x20 の位置に移して足す。if を使わずに大文字だけを変換する。
language: cpp
project: Folly
repo: https://github.com/facebook/folly
license: Apache-2.0
copyright: Copyright (c) Meta Platforms, Inc. and affiliates.
commit: "d4d6587a595d5507fde85b9c5797e013b9120892"
file: folly/String.cpp
lines: [549, 605]
function: folly::toLowerAscii8
difficulty: 3
format: 2
tags: [ビット演算, 文字列処理, ハック]
---

## ひとことで

`toLowerAscii8(c)` は、文字 `c` が `'A'`〜`'Z'` なら小文字にし、それ以外はそのままにします。
ASCII では大文字に `0x20`（32）を足すと小文字になります（`'A'` = 65、`'a'` = 97）。問題は「大文字のときだけ足す」をどう書くかです。

この関数は **`if` を使わず**、足し算・AND・シフトだけで「大文字なら `0x20`、それ以外なら `0`」という値を作って足します。

## コード

::: code-group

```cpp:line-numbers=549 [日本語訳]
void toLowerAscii8(char& c) {
  // 分岐なしの tolower。次で説明されている入力を回転させる技に基づく
  // http://www.azillionmonkeys.com/qed/asmexample.html
  //
  // このアルゴリズムは次の観察に基づく: ASCII の大文字は
  // どれも 0x20 を足せば対応する小文字に
  // 変換できる。

  // Step 1: 最上位ビットを消す。これは Step 5 で扱う。
  auto rotated = uint8_t(c & 0x7f);
  // この時点の rotated の値は、元の c に応じて次のとおり:
  //   'A' 未満:     0- 64
  //   'A'-'Z':    65- 90
  //   'Z' より上:  91-127

  // Step 2: 0x25 (37) を足す
  rotated += 0x25;
  // この時点の rotated の値は、元の c に応じて次のとおり:
  //   'A' 未満:    37-101
  //   'A'-'Z':    102-127
  //   'Z' より上: 128-164

  // Step 3: 最上位ビットを消す
  rotated &= 0x7f;
  //   'A' 未満:    37-101
  //   'A'-'Z':    102-127
  //   'Z' より上:    0- 36

  // Step 4: 0x1a (26) を足す
  rotated += 0x1a;
  //   'A' 未満:    63-127
  //   'A'-'Z':    128-153
  //   'Z' より上:   25- 62

  // ここで、最上位ビットが立った値（128 以上）に変わったのは
  // 大文字だけであることに注目。

  // Step 5: 最上位ビットを 2 つ右へずらす。0x20 の唯一の 1 ビットの
  // 位置だ。ただその前に、Step 1 で元の c の最上位ビットを無視した点はどうか。
  // そのビットが立っていたなら、128+'A' から 128+'Z' の範囲の値で
  // 誤って一致したかもしれない。これを直すには、c の最上位ビットが
  // 立っているときに rotated の最上位ビットを消す必要がある。
  // rotated の他のビットはどうでもよいので、いちばん簡単なのは
  // c の全ビットを反転して rotated と AND を取ること。
  //
  rotated &= ~c;
  rotated >>= 2;

  // Step 6: rotated の 0x20 のビット以外をすべて消す
  // マスクをかける。
  rotated &= 0x20;

  // この時点で rotated は、c が 'A'-'Z' なら 0x20、それ以外なら 0x00

  // Step 7: rotated を c に足す
  c += char(rotated);
}
```

```cpp:line-numbers=549 [原文]
void toLowerAscii8(char& c) {
  // Branchless tolower, based on the input-rotating trick described
  // at http://www.azillionmonkeys.com/qed/asmexample.html
  //
  // This algorithm depends on an observation: each uppercase
  // ASCII character can be converted to its lowercase equivalent
  // by adding 0x20.

  // Step 1: Clear the high order bit. We'll deal with it in Step 5.
  auto rotated = uint8_t(c & 0x7f);
  // Currently, the value of rotated, as a function of the original c is:
  //   below 'A':   0- 64
  //   'A'-'Z':    65- 90
  //   above 'Z':  91-127

  // Step 2: Add 0x25 (37)
  rotated += 0x25;
  // Now the value of rotated, as a function of the original c is:
  //   below 'A':   37-101
  //   'A'-'Z':    102-127
  //   above 'Z':  128-164

  // Step 3: clear the high order bit
  rotated &= 0x7f;
  //   below 'A':   37-101
  //   'A'-'Z':    102-127
  //   above 'Z':    0- 36

  // Step 4: Add 0x1a (26)
  rotated += 0x1a;
  //   below 'A':   63-127
  //   'A'-'Z':    128-153
  //   above 'Z':   25- 62

  // At this point, note that only the uppercase letters have been
  // transformed into values with the high order bit set (128 and above).

  // Step 5: Shift the high order bit 2 spaces to the right: the spot
  // where the only 1 bit in 0x20 is.  But first, how we ignored the
  // high order bit of the original c in step 1?  If that bit was set,
  // we may have just gotten a false match on a value in the range
  // 128+'A' to 128+'Z'.  To correct this, need to clear the high order
  // bit of rotated if the high order bit of c is set.  Since we don't
  // care about the other bits in rotated, the easiest thing to do
  // is invert all the bits in c and bitwise-and them with rotated.
  rotated &= ~c;
  rotated >>= 2;

  // Step 6: Apply a mask to clear everything except the 0x20 bit
  // in rotated.
  rotated &= 0x20;

  // At this point, rotated is 0x20 if c is 'A'-'Z' and 0x00 otherwise

  // Step 7: Add rotated to c
  c += char(rotated);
}
```

:::

## 前提知識

- **`char& c`**: `c` は呼び出し元の変数への **参照** です。関数の中で `c` を変えると、呼び出し元の文字が書き換わります。
- **`uint8_t`**: 0〜255 の 8 ビット符号なし整数です。255 を超えると 256 で割った余りに戻ります。
- **`0x7f`、`0x80`、`0x20`**: 2 進数で `0111 1111`、`1000 0000`、`0010 0000` です。`0x80` は最上位ビット（MSB）、`0x20` は小文字と大文字を分けるビットです。
- **`&`、`~`、`>>`**: ビットごとの AND、全ビット反転、右シフトです。
- **`auto`**: 右辺から型を推論します。`uint8_t(c & 0x7f)` なので `rotated` は `uint8_t` です。
- **`+=` と `char(...)`**: `char(rotated)` は値を `char` 型に変換しています。

## 何をしているか

アイデアは、**大文字のときだけ最上位ビット（128 以上）になるように値をずらす** ことです。コメントに各段階の値の範囲が書かれているので、それに沿って `'A'`（65）、`'z'`（122）、`'@'`（64）で追います。

### Step 1: 最上位ビットを消す

```cpp:line-numbers=557
  // Step 1: Clear the high order bit. We'll deal with it in Step 5.
```

`c & 0x7f` で 0〜127 にします。ASCII の範囲ではそのままです。

### Step 2: 0x25 を足す

```cpp:line-numbers=564
  // Step 2: Add 0x25 (37)
```

| 区分 | 範囲 | 例 |
| --- | --- | --- |
| `'A'` 未満 | 37〜101 | `'@'` → 101 |
| `'A'`〜`'Z'` | 102〜127 | `'A'` → 102 |
| `'Z'` より上 | 128〜164 | `'z'` → 159 |

`'Z'`（90）が 127 にちょうど届くように 37 を足しています。

### Step 3: 最上位ビットを消す

```cpp:line-numbers=571
  // Step 3: clear the high order bit
```

128 以上になった「`'Z'` より上」のグループだけが 0〜36 に落ちます。`'z'` は 159 → 31 です。

### Step 4: 0x1a（26）を足す

```cpp:line-numbers=577
  // Step 4: Add 0x1a (26)
```

| 区分 | 範囲 | 例 |
| --- | --- | --- |
| `'A'` 未満 | 63〜127 | `'@'` → 127 |
| `'A'`〜`'Z'` | 128〜153 | `'A'` → 128 |
| `'Z'` より上 | 25〜62 | `'z'` → 57 |

**大文字だけが 128 以上** になりました。`'@'` は 127 で、ぎりぎり届きません。

### Step 5: 元の最上位ビットで補正し、2 つ右へ

```cpp:line-numbers=594
  rotated &= ~c;
  rotated >>= 2;
```

Step 1 で元の `c` の最上位ビットを無視したので、128 以上の文字（ASCII 以外）も誤って一致するかもしれません。そこで `rotated &= ~c` で、元の `c` の最上位ビットが立っていた場合は `rotated` の最上位ビットを消します。
そのあと `>> 2` で、最上位ビット（`0x80`）を `0x20` の位置に移します。

### Step 6・7: 0x20 だけ残して足す

```cpp:line-numbers=599
  rotated &= 0x20;
```

```cpp:line-numbers=604
  c += char(rotated);
```

`& 0x20` でそのビットだけを残すと、大文字なら `0x20`、それ以外なら `0` です。これを `c` に足して完成です。`'A'`（65）は 97 = `'a'` になります。

## ここがすごい

- **分岐がない**: `if (c >= 'A' && c <= 'Z') c += 32;` は 2 つの比較と分岐を含みます。文字の種類がランダムに混ざる文章では、分岐予測が外れやすくなります。この方法はどんな文字でも同じ命令列です。
- **8 ビットの外にあふれない**: すべての足し算が 8 ビット以内に収まるよう値が選ばれています。だからこそ、隣の関数 `toLowerAscii32` / `toLowerAscii64` では **4 文字・8 文字を 1 つの整数に詰めて同時に処理** できます。1 文字ずつの比較では、この並列化はできません。
- **境界の扱いが丁寧**: ASCII 以外のバイト（UTF-8 の一部など）を誤って書き換えないよう、Step 5 で元の最上位ビットを使って補正しています。
- **コメントが証明になっている**: 各ステップのあとの値の範囲が表のように書かれているので、なぜ正しいかを読者が自分で確かめられます。冒頭のコメントには、元になった手法の出典も示されています。

## まとめ

- 「条件を満たすときだけ足す」は、条件を 1 ビットに変換できれば分岐なしで書ける。
- 足し算で値の範囲をずらすと、「ある範囲に入っているか」を 1 ビットで表せる。
- あふれない演算だけで組み立てると、複数の値を 1 つの整数に詰めて同時に処理できる（SWAR）。
- ビット技を使うときは、各段階の値の範囲をコメントに書いておくと検証しやすい。
