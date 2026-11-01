---
title: "空かどうかを確かめながら、先頭の要素を安全に取り出す"
description: ".NET の Queue<T>.TryDequeue。空なら例外を投げずに false を返し、要素があれば先頭を取り出して次へ進める。参照型は取り出した後の枠を空に戻し、GC が解放できるようにする。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Collections/Generic/Queue.cs
lines: [215, 235]
function: "Queue<T>.TryDequeue(out T)"
difficulty: 2
format: 2
tags: [データ構造, メモリ管理, 防御的プログラミング]
---

## ひとことで

`TryDequeue(out result)` は、キューの **先頭の要素を取り出す** 関数です。
キューが空のときは例外を投げず、`false` を返します。要素があれば `true` を返し、取り出した値は `result` に入ります。

`Dequeue()` が空のときに例外を投げるのに対し、こちらは「空かどうか」を戻り値で分けられるので、ループの終了条件にそのまま使えます。

## コード

```csharp:line-numbers=215
        public bool TryDequeue([MaybeNullWhen(false)] out T result)
        {
            int head = _head;
            T[] array = _array;

            if (_size == 0)
            {
                result = default;
                return false;
            }

            result = array[head];
            if (RuntimeHelpers.IsReferenceOrContainsReferences<T>())
            {
                array[head] = default!;
            }
            MoveNext(ref _head);
            _size--;
            _version++;
            return true;
        }
```

## 前提知識

- **キュー（Queue）**: 先に入れた要素から先に取り出す、行列のような仕組みです。
- **リングバッファ**: 配列を端から端まで円のようにつなげて使う仕組みです。末尾を超えたら先頭に戻ります。
- **`out` 引数**: 関数の中で値を入れて、呼び出し側に返すための引数です。
- **`MaybeNullWhen(false)`**: 戻り値が `false` のとき、`result` が `null` になり得ることを、コンパイラに伝える印です。
- **GC（ガベージコレクション）**: 使われなくなったメモリを自動で解放する仕組みです。参照が残っている限り、そのオブジェクトは解放されません。

## 何をしているか

### 1. 空かどうかを確かめる

```csharp:line-numbers=217
            int head = _head;
            T[] array = _array;

            if (_size == 0)
            {
                result = default;
                return false;
            }
```

`_size` が 0 なら、`result` を既定値にして `false` を返します。例外は投げません。

### 2. 先頭の値を取り出す

```csharp:line-numbers=226
            result = array[head];
            if (RuntimeHelpers.IsReferenceOrContainsReferences<T>())
            {
                array[head] = default!;
            }
```

`array[head]` の値を `result` に入れます。参照型なら、取り出した後の枠を `default` に戻します。取り出された値への参照を、配列が持ち続けないようにするためです。

### 3. 先頭を進めて、個数を減らす

```csharp:line-numbers=231
            MoveNext(ref _head);
            _size--;
            _version++;
            return true;
```

`MoveNext` で先頭の位置を 1 つ進め、`_size` を 1 減らします。`_version` を増やすのは、列挙の途中で変更されたことを検出するためです。最後に `true` を返します。

## ここがすごい

- **例外を使わずに終わりを知らせる**: 空のキューを何度も確認する処理でも、例外のコストを払わずに済みます。
- **参照を残さない**: 取り出した後の枠を空にするので、要らなくなった大きなオブジェクトが GC で解放されます。
- **円形の配列を使う**: `MoveNext` が末尾を超えたら先頭へ戻すので、配列を伸ばさずに使い回せます。
- **変更を検出できる**: `_version` を上げることで、列挙中に変更があれば例外で知らせられます。

## まとめ

- `TryDequeue` は、空なら `false`、要素があれば先頭を取り出して `true` を返す。
- 参照型では、取り出した後の枠を空に戻し、メモリが解放されるようにする。
- 先頭を円形に進め、個数と版番号を更新する。
