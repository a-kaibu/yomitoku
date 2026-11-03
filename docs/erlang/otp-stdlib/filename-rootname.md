---
title: "拡張子の前までを取り出す、型ごとの入り口"
description: "filename:rootname/1 は、パスから拡張子を取り除いた部分を返す。バイナリは一度文字列に変えて処理し、文字列は flatten してから OS に合った規則で判定する。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1997-2025. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/filename.erl
lines: [845, 849]
function: "filename:rootname/1"
difficulty: 2
format: 2
tags: ["ファイル", "文字列処理", "移植性"]
---
## ひとことで

`filename:rootname/1` は、パスから拡張子を取り除いた部分を返します。たとえば `"/tmp/report.txt"` は、`"/tmp/report"` になります。
拡張子を判断する本体の処理は、`rootname/4` が OS の規則に合わせて行います。この関数は、入力の型を整えてそれに渡す入り口です。

## コード

::: code-group

```erlang:line-numbers=845 [日本語訳]
rootname(Name) when is_binary(Name) ->
    list_to_binary(rootname(binary_to_list(Name))); % Unicode の扱いは不要（. は 128 未満の文字）
rootname(Name0) ->
    Name = flatten(Name0),
    rootname(Name, [], [], major_os_type()).
```

```erlang:line-numbers=845 [原文]
rootname(Name) when is_binary(Name) ->
    list_to_binary(rootname(binary_to_list(Name))); % No need to handle unicode, . is < 128
rootname(Name0) ->
    Name = flatten(Name0),
    rootname(Name, [], [], major_os_type()).
```

:::

## 前提知識

- **拡張子**: ファイル名の最後の `.` 以降の部分です。`report.txt` なら `txt` です。
- **ルート名（rootname）**: 拡張子を除いた部分です。
- **バイナリと文字列**: 同じパスを、バイナリ（`<<"...">>`）と文字列（`"..."`）の 2 通りで渡せます。
- **`binary_to_list/1` と `list_to_binary/1`**: バイナリと文字列（リスト）を相互に変換します。
- **`flatten/1`**: 入れ子のリストを平らにします。
- **`major_os_type/0`**: 今の OS の大まかな種類を返します。

## 何をしているか

### 1. バイナリのとき

```erlang:line-numbers=845
rootname(Name) when is_binary(Name) ->
    list_to_binary(rootname(binary_to_list(Name))); % No need to handle unicode, . is < 128
```

バイナリは、文字列に変換して `rootname/1` にかけ、結果をもう一度バイナリに戻します。コメントにあるとおり、ここでは Unicode の心配はいりません。拡張子の `.` は、ASCII の範囲の文字だからです。

### 2. 文字列のとき

```erlang:line-numbers=847
rootname(Name0) ->
    Name = flatten(Name0),
    rootname(Name, [], [], major_os_type()).
```

文字列は、まず `flatten/1` で平らにします。そのうえで、今の OS の種類 `major_os_type()` を添えて、`rootname/4` に任せます。

## ここがすごい

### 入り口で型をそろえ、本体は 1 つにする

バイナリと文字列の両方を受け付けても、判定の本体は `rootname/4` の 1 つだけです。バイナリは文字列に直してから本体へ渡し、結果を元の型に戻します。
型の処理を入り口に集めることで、判定の規則を 1 か所で管理できます。

### ASCII の文字だけを見ればよい、という前提

拡張子を探すのは、`.` という 1 文字を探すことです。`.` は ASCII の文字なので、バイナリを文字列に変えても、結果がずれることはありません。
コメントに書かれたこの前提が、Unicode の処理を省ける理由です。

## まとめ

- 型の違いは入り口で吸収し、判定の本体は 1 か所にまとめると保守しやすくなります。
- 探す文字が ASCII だけなら、バイナリと文字列を行き来しても安全です。
- 処理の前提（ここでは ASCII であること）は、コメントで残しておくと、後の読者の助けになります。
