---
title: "値が等しいかではなく、同じ物かどうかでリストを探す"
description: "Newtonsoft.Json の CollectionUtils.IndexOfReference。Equals で比べるのではなく、ReferenceEquals で同じオブジェクトかどうかを見て、最初の位置を返す。"
language: csharp
project: "Newtonsoft.Json"
repo: https://github.com/JamesNK/Newtonsoft.Json
license: MIT
copyright: "Copyright (c) 2007 James Newton-King"
commit: "52fa3aef1f2cadcd3a3f874251eddc98d3efbbaa"
file: Src/Newtonsoft.Json/Utilities/CollectionUtils.cs
lines: [253, 264]
function: "CollectionUtils.IndexOfReference<T>(List<T>, T)"
difficulty: 2
format: 2
tags: [データ構造, 可読性, 防御的プログラミング]
---

## ひとことで

`IndexOfReference(list, item)` は、リストの中から **同じ物（同じ参照）** が、最初に何番目にあるかを返す関数です。
見つからなければ `-1` を返します。

ふつうの `IndexOf` は「中身が等しいか」で比べます。この関数は「同じオブジェクトか」で比べるので、中身が同じでも別の物は区別します。

## コード

```csharp:line-numbers=253
        public static int IndexOfReference<T>(this List<T> list, T item)
        {
            for (int i = 0; i < list.Count; i++)
            {
                if (ReferenceEquals(item, list[i]))
                {
                    return i;
                }
            }

            return -1;
        }
```

## 前提知識

- **参照（オブジェクトの同一性）**: 変数が指している、メモリ上の 1 つの実体のことです。2 つの変数が同じ実体を指していれば「同じ物」です。
- **値の等しさ（`Equals`）**: 中身が同じかどうかを比べる仕組みです。2 つの別の物でも、中身が同じなら等しいとみなすことがあります。
- **`ReferenceEquals`**: 2 つの変数が同じ実体を指しているかを、中身を見ずに判定する関数です。
- **`List<T>.Count`**: リストの要素数です。ループの上限に使います。
- **`-1`**: 見つからなかったことを表す、慣習的な値です。

## 何をしているか

### 1. 先頭から 1 つずつ見る

```csharp:line-numbers=255
            for (int i = 0; i < list.Count; i++)
```

`i` を 0 から要素数の手前まで、1 つずつ増やして調べます。

### 2. 同じ物かどうかを比べる

```csharp:line-numbers=257
                if (ReferenceEquals(item, list[i]))
                {
                    return i;
                }
```

`ReferenceEquals(item, list[i])` が `true` なら、同じ物が見つかったので、その位置 `i` を返します。

### 3. 見つからなければ -1

```csharp:line-numbers=263
            return -1;
```

最後まで同じ物が無ければ、`-1` を返します。

## ここがすごい

- **中身が同じでも区別する**: 2 つの別の物が偶然同じ中身を持っていても、取り違えません。
- **比べる処理が軽い**: 中身を調べず、住所（参照）が同じかだけを見るので、比べる手間が少なくなります。
- **循環の検出に使える**: JSON などで、同じ物を再び読んでいないかを調べるときに、このような比べ方が役立ちます。
- **値が `null` でも安全**: 参照の比べ方なので、中身を読む必要がなく、例外になりにくい作りです。

## まとめ

- `IndexOfReference` は、`Equals` ではなく `ReferenceEquals` で、同じ物の位置を探す。
- 中身が同じでも別の物は区別する。
- 見つからなければ `-1` を返す。
