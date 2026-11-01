---
title: "「接頭辞:名前」の形の名前を、コロンの位置で 2 つに分ける"
description: "Newtonsoft.Json の GetQualifiedNameParts。XML の名前（例 xs:string）を、コロンより前の接頭辞と後ろのローカル名に分ける。コロンが先頭や末尾にあるときは、分けずに全体を名前とみなす。"
language: csharp
project: "Newtonsoft.Json"
repo: https://github.com/JamesNK/Newtonsoft.Json
license: MIT
copyright: "Copyright (c) 2007 James Newton-King"
commit: "52fa3aef1f2cadcd3a3f874251eddc98d3efbbaa"
file: Src/Newtonsoft.Json/Utilities/MiscellaneousUtils.cs
lines: [136, 149]
function: "MiscellaneousUtils.GetQualifiedNameParts(string, out string?, out string)"
difficulty: 1
format: 2
tags: [文字列処理, 防御的プログラミング, 可読性]
---

## ひとことで

`GetQualifiedNameParts(qualifiedName, out prefix, out localName)` は、XML の名前空間付きの名前を、**接頭辞（prefix）** と **ローカル名** の 2 つに分ける関数です。
たとえば `xs:string` は、接頭辞 `xs` とローカル名 `string` に分かれます。

コロンがない名前（`string`）は、接頭辞がなく、全体がローカル名になります。

## コード

```csharp:line-numbers=136
        public static void GetQualifiedNameParts(string qualifiedName, out string? prefix, out string localName)
        {
            int colonPosition = StringUtils.IndexOf(qualifiedName, ':');

            if ((colonPosition == -1 || colonPosition == 0) || (qualifiedName.Length - 1) == colonPosition)
            {
                prefix = null;
                localName = qualifiedName;
            }
            else
            {
                prefix = qualifiedName.Substring(0, colonPosition);
                localName = qualifiedName.Substring(colonPosition + 1);
            }
```

## 前提知識

- **名前空間（namespace）**: 名前の衝突を避けるための区切りです。XML では、`接頭辞:名前` の形で書きます。
- **接頭辞（prefix）**: 名前空間を短く指すための文字列です。
- **ローカル名（local name）**: 接頭辞を除いた、名前の本体の部分です。
- **`out` 引数**: 関数の中で値を入れて、呼び出し側に 2 つの結果を返すための引数です。
- **`Substring`**: 文字列の一部分を取り出す関数です。`Substring(0, n)` は先頭から `n` 文字、`Substring(n + 1)` は `n + 1` 文字目以降です。

## 何をしているか

### 1. コロンの位置を探す

```csharp:line-numbers=138
            int colonPosition = StringUtils.IndexOf(qualifiedName, ':');
```

`StringUtils.IndexOf` で、名前の中の `:` の位置を探します。見つからなければ `-1` です。

### 2. 分けられない場合は、全体をローカル名にする

```csharp:line-numbers=140
            if ((colonPosition == -1 || colonPosition == 0) || (qualifiedName.Length - 1) == colonPosition)
            {
                prefix = null;
                localName = qualifiedName;
            }
```

コロンが無い場合、先頭にある場合、末尾にある場合は、接頭辞がないものとして扱います。`prefix` は `null`、`localName` は名前全体です。

### 3. 分けられる場合は、コロンの前後で切る

```csharp:line-numbers=145
            else
            {
                prefix = qualifiedName.Substring(0, colonPosition);
                localName = qualifiedName.Substring(colonPosition + 1);
```

それ以外は、コロンより前を接頭辞、コロンより後ろをローカル名にします。

### 具体例で確かめる

```
"xs:string"  → 接頭辞 "xs"、ローカル名 "string"
"string"     → 接頭辞なし、ローカル名 "string"
":string"    → コロンが先頭なので、分けない（ローカル名 ":string"）
"xs:"        → コロンが末尾なので、分けない（ローカル名 "xs:"）
```

## ここがすごい

- **不正な形を壊さない**: 先頭や末尾のコロンは、接頭辞や名前が空になってしまうので、分けずに全体を返します。
- **1 回の探索で決まる**: コロンの位置を 1 回求めれば、2 つの結果がそのまま決まります。
- **2 つの取り出しを 1 つの関数に**: 接頭辞だけ、ローカル名だけを欲しい場合は、この関数を呼ぶ補助の関数（`GetPrefix`、`GetLocalName`）を使えます。
- **`null` で接頭辞がないことを表す**: 接頭辞が無いときは `null` を返し、空の文字列と区別できます。

## まとめ

- `GetQualifiedNameParts` は、`接頭辞:名前` の形を、コロンの位置で 2 つに分ける。
- コロンが無い、または先頭や末尾にある場合は、分けずに全体をローカル名とする。
- 接頭辞がない場合は `null` を返し、名前の本体はローカル名として残る。
