---
title: "スタックの先頭を、空でなければ取り出す"
description: ".NET Runtime の Stack<T>.TryPop。空のときは例外を投げず false を返し、取り出した後の枠を既定値で消して GC が回収できるようにする。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Collections/src/System/Collections/Generic/Stack.cs
lines: [244, 263]
function: "Stack<T>.TryPop(out T)"
difficulty: 2
format: 2
tags: [データ構造, メモリ管理, 標準ライブラリ]
---

## ひとことで

`TryPop` は、スタック（後から入れたものが先に出る入れ物）の一番上の要素を **取り出す** 関数です。
空なら例外を投げず、`false` を返します。取り出せたら `true` を返し、要素は `out` の引数で受け取ります。

「取り出せるか」を戻り値で伝えるので、呼び出し側は `try` で例外を捕まえなくて済みます。

## コード

```csharp:line-numbers=244
        public bool TryPop([MaybeNullWhen(false)] out T result)
        {
            int size = _size - 1;
            T[] array = _array;

            if ((uint)size >= (uint)array.Length)
            {
                result = default!;
                return false;
            }

            _version++;
            _size = size;
            result = array[size];
            if (RuntimeHelpers.IsReferenceOrContainsReferences<T>())
            {
                array[size] = default!;
            }
            return true;
        }
```

## 前提知識

- **スタック**: 後から入れた要素が、先に取り出される入れ物です。皿を積み重ねるイメージです。
- **`out` 引数**: 関数の中で値を設定し、呼び出し側が受け取る引数です。戻り値とは別に値を返せます。
- **`_size` と `_array`**: スタックの中の要素数と、要素を入れておく配列です。`_size` は次に入る場所の番号を表します。
- **`default!`**: 型の既定値（参照型なら `null`）を入れる書き方です。`!` は、`null` でもよいという印です。
- **`RuntimeHelpers.IsReferenceOrContainsReferences<T>()`**: 型が参照を含むかを、実行時に調べる .NET の関数です。含まない型では、消す処理を省けます。
- **`[MaybeNullWhen(false)]`**: 戻り値が `false` のとき、`result` が `null` のままでもよいことを示す属性です。

## 何をしているか

### 1. 一番上の位置を計算する

```csharp:line-numbers=246
            int size = _size - 1;
            T[] array = _array;
```

`_size - 1` が、一番上の要素の番号です。空のときは `-1` になります。

### 2. 空かどうかを確かめる

```csharp:line-numbers=249
            if ((uint)size >= (uint)array.Length)
            {
                result = default!;
                return false;
            }
```

`(uint)size >= (uint)array.Length` で、範囲を確かめます。`-1` を符号なしに直すと、とても大きな数になるため、この比較 1 回で空も範囲外も判定できます。空なら `result` を既定値にして、`false` を返します。

### 3. 要素数を減らす

```csharp:line-numbers=255
            _version++;
            _size = size;
```

取り出すので、版の番号（`_version`）を進め、要素数を 1 減らします。

### 4. 要素を受け取る

```csharp:line-numbers=257
            result = array[size];
```

一番上の要素を `result` に入れます。

### 5. 参照を含む型なら、枠を消す

```csharp:line-numbers=258
            if (RuntimeHelpers.IsReferenceOrContainsReferences<T>())
            {
                array[size] = default!;
            }
```

参照を含む型のときは、取り出した後の枠を `default!` にします。そうしないと、もう使わない要素を配列が参照し続け、GC が回収できなくなります。

### 6. 成功を返す

```csharp:line-numbers=262
            return true;
```

取り出せたので、`true` を返します。

## ここがすごい

- **例外を使わない**: 空のときに例外を投げないので、空かどうかを調べるだけの処理が安く済みます。
- **符号なしの比較の工夫**: 範囲の下限を `0` と比べる代わりに、`uint` の 1 回の比較で空と範囲外をまとめて判定しています。
- **メモリを残さない**: 取り出した後の枠を消すので、不要になったオブジェクトが残り続けません。

## まとめ

- `size` を一番上の番号にし、符号なしの比較で空かどうかを調べる。
- 空なら `false` を返し、取り出せたら要素数と版を更新する。
- 参照を含む型なら、取り出した後の枠を消して GC に任せる。
