---
title: "2 つのキーを XOR で合わせる、簡単だが偏りやすいハッシュ"
description: "Newtonsoft.Json の StructMultiKey。2 つの値のハッシュコードを XOR で合わせて辞書のキーにする。手軽だが、同じ値の組で 0 になるなど、弱点も併せて読める例。"
language: csharp
project: "Newtonsoft.Json"
repo: https://github.com/JamesNK/Newtonsoft.Json
license: MIT
copyright: "Copyright (c) 2007 James Newton-King"
commit: "52fa3aef1f2cadcd3a3f874251eddc98d3efbbaa"
file: Src/Newtonsoft.Json/Utilities/StructMultiKey.cs
lines: [41, 59]
function: "StructMultiKey<T1, T2>.GetHashCode"
difficulty: 2
format: 2
tags: [ハッシュ, 設計パターン, イディオム]
---

## ひとことで

\`StructMultiKey<T1, T2>\` は、**2 つの値を 1 組にしたキー** を表す構造体です。2 つの値を 1 組にして、辞書のキーなどとして使うための構造体です。
\`GetHashCode\` は、2 つの値のハッシュコードを **XOR（排他的論理和）** で合わせて、1 つの値にします。

## コード

```csharp:line-numbers=41
        public override int GetHashCode()
        {
            return (Value1?.GetHashCode() ?? 0) ^ (Value2?.GetHashCode() ?? 0);
        }

        public override bool Equals(object? obj)
        {
            if (!(obj is StructMultiKey<T1, T2> key))
            {
                return false;
            }

            return Equals(key);
        }

        public bool Equals(StructMultiKey<T1, T2> other)
        {
            return (Equals(Value1, other.Value1) && Equals(Value2, other.Value2));
        }
```

## 前提知識

- **構造体（\`struct\`）**: 値として扱われる型です。\`readonly struct\` は、作った後で中身を変えられないことを表します。
- **\`GetHashCode()\`**: オブジェクトのハッシュコードを返します。同じ値なら同じ結果になる必要があります。
- **\`IEquatable<T>\`**: 「自分と同じ型の値と等しいかを判定できる」という約束を表すインターフェイスです。
- **\`?.\` と \`??\`**: \`Value1?.GetHashCode()\` は、\`Value1\` が \`null\` なら \`null\` を返し、\`?? 0\` で 0 に置き換えます。
- **XOR（\`^\`）**: 桁ごとに「違えば 1、同じなら 0」になる演算です。

## 何をしているか

### 1. 2 つのハッシュコードを XOR する

```csharp:line-numbers=43
            return (Value1?.GetHashCode() ?? 0) ^ (Value2?.GetHashCode() ?? 0);
```

\`Value1\` と \`Value2\` のハッシュコードを取り出し、XOR で 1 つにまとめます。どちらかが \`null\` なら 0 として扱います。

例: \`(3, 5)\` のハッシュコードは \`3 ^ 5 = 6\` です。

### 2. 等しさは成分ごとに比べる

```csharp:line-numbers=56
        public bool Equals(StructMultiKey<T1, T2> other)
        {
            return (Equals(Value1, other.Value1) && Equals(Value2, other.Value2));
```

同じ型の別の組と等しいかどうかは、\`Value1\` どうし、\`Value2\` どうしを比べて、両方が等しければ等しいとします。

## ここがすごい

- **簡潔**: 2 つの値を 1 行で合わせられます。手早くキーを作るには、読みやすい書き方です。
- **弱点を知っておく価値がある**: XOR は、同じ値を 2 つ組み合わせると 0 になります。\`(5, 5)\` も \`(7, 7)\` もハッシュが 0 になり、同じ場所に集まります。また、\`(1, 2)\` と \`(2, 1)\` も同じハッシュになります。順番の情報が失われるからです。
- **比べるときは順番が効く**: \`Equals\` では \`Value1\` と \`Value2\` を別々に比べるので、\`(1, 2)\` と \`(2, 1)\` は等しくないと判定されます。ハッシュの衝突は性能の問題だけですが、\`Equals\` が正しいことで、辞書としては動きます。
- **比べて思い出す**: 同じ値の組が多い辞書では、この弱点が速さを下げることがあります。そうした場合は、\`System.HashCode.Combine\` のように、順番と値を混ぜる方法を使うと偏りが減ります。

## まとめ

- 2 つのハッシュを合わせる方法として XOR は簡単だが、同じ値の組や順番の入れ替えで衝突しやすい。
- 等しさの判定は、成分ごとに比べれば正しく動く。ハッシュは性能のための近似だと考えるとよい。
- ハッシュを設計するときは、どんな値の組が来やすいかを想像して弱点を確かめる。
