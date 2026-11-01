---
title: "連続する %XX を一度にバイト列にまとめてから文字に戻す"
description: "Spring の StringUtils.uriDecode。URL の %E3%81%82 のような形式を元の文字に戻す。マルチバイト文字は何バイトにもまたがるので、連続するエスケープを一つのバイト列として集めてから文字コードで変換する。"
language: java
project: Spring Framework
repo: https://github.com/spring-projects/spring-framework
license: Apache-2.0
copyright: "Copyright 2002-present the original author or authors."
commit: "ed4e0f896bc01279196a2c370fbfd15c7b201eed"
file: spring-core/src/main/java/org/springframework/util/StringUtils.java
lines: [845, 889]
function: "StringUtils.uriDecode"
difficulty: 3
format: 2
tags: [文字列処理, Unicode, パース]
---

## ひとことで

`StringUtils.uriDecode(source, charset)` は、URL に含まれる `%XX` 形式の文字を元に戻す関数です。たとえば `%E3%81%82` は、指定した文字コードが UTF-8 なら `あ` になります。

この関数の見どころは、**`%` の連続を 1 つのバイト列として集めてから、まとめて文字に変換する** ことです。日本語のような文字は、UTF-8 で 3 バイトに分かれて、3 つの `%XX` として書かれます。1 つずつ変換すると、文字が正しく戻りません。

## コード

```java:line-numbers=845
	public static String uriDecode(String source, Charset charset) {
		int length = source.length();
		int firstPercentIndex = source.indexOf('%');
		if (length == 0 || firstPercentIndex < 0) {
			return source;
		}

		StringBuilder output = new StringBuilder(length);
		output.append(source, 0, firstPercentIndex);
		byte[] bytes = null;
		int i = firstPercentIndex;
		while (i < length) {
			char ch = source.charAt(i);
			if (ch == '%') {
				try {
					if (bytes == null) {
						bytes = new byte[(length - i) / 3];
					}

					int pos = 0;
					while (i + 2 < length && ch == '%') {
						bytes[pos++] = (byte) HexFormat.fromHexDigits(source, i + 1, i + 3);
						i += 3;
						if (i < length) {
							ch = source.charAt(i);
						}
					}

					if (i < length && ch == '%') {
						throw new IllegalArgumentException("Incomplete trailing escape (%) pattern");
					}

					output.append(new String(bytes, 0, pos, charset));
				}
				catch (NumberFormatException ex) {
					throw new IllegalArgumentException("Invalid encoded sequence \"" + source.substring(i) + "\"");
				}
			}
			else {
				output.append(ch);
				i++;
			}
		}
		return output.toString();
	}
```

## 前提知識

- **パーセントエンコーディング**: URL では、英数字以外の文字を `%` と 16 進数 2 桁で表します。`%20` は空白です。
- **文字コード（charset）**: 文字をバイトの列に変える決まりです。UTF-8 では、日本語 1 文字がふつう 3 バイトです。
- **16 進数**: `E3` は 227 です。1 バイトを 2 桁で表せます。
- **`StringBuilder`**: 文字列を少しずつ組み立てるための、変更できる文字列です。
- **`HexFormat.fromHexDigits`**: 16 進数の文字列を、数に変換する Java の標準の関数です。
- **`byte` のキャスト**: `int` の値を 1 バイトとして入れる書き方です。

## 何をしているか

### 1. `%` が無ければそのまま返す

```java:line-numbers=846
		int length = source.length();
		int firstPercentIndex = source.indexOf('%');
		if (length == 0 || firstPercentIndex < 0) {
			return source;
		}

		StringBuilder output = new StringBuilder(length);
		output.append(source, 0, firstPercentIndex);
```

`%` が 1 つも無いか、文字列が空なら、変換する必要がありません。そのまま返して速さを保ちます。最初の `%` より前の部分は、先にまとめてコピーしておきます。

### 2. `%XX` の連続をバイトに集める

```java:line-numbers=858
			if (ch == '%') {
				try {
					if (bytes == null) {
						bytes = new byte[(length - i) / 3];
					}

					int pos = 0;
					while (i + 2 < length && ch == '%') {
						bytes[pos++] = (byte) HexFormat.fromHexDigits(source, i + 1, i + 3);
						i += 3;
						if (i < length) {
							ch = source.charAt(i);
						}
					}
```

`%` を見つけると、後ろに続く `%XX` を次々に読み、その値を `bytes` に入れていきます。`bytes` は、いったん長さの上限で確保しておき、読んだ個数（`pos`）だけを使います。

ここが要点です。`%E3%81%82` は、3 つのバイト `E3`、`81`、`82` の並びです。3 つをまとめて読むことで、UTF-8 の 1 文字を正しく取り出せます。

### 3. まとめて文字に変換する

```java:line-numbers=873
					if (i < length && ch == '%') {
						throw new IllegalArgumentException("Incomplete trailing escape (%) pattern");
					}

					output.append(new String(bytes, 0, pos, charset));
```

集めたバイトを、指定された文字コードで文字列にします。`new String(bytes, 0, pos, charset)` は、先頭の `pos` 個のバイトを、その文字コードの文字として解釈します。

### 4. `%` でない文字はそのまま

```java:line-numbers=883
			else {
				output.append(ch);
				i++;
			}
```

`%` でない文字は、そのまま出力に追加します。

### 具体的な値で追う

`source = "%E3%81%82"` を変換します。

- `i = 0`: `%E3` を読み、`bytes[0] = 0xE3`。`i = 3`。
- `i = 3`: `%81` を読み、`bytes[1] = 0x81`。`i = 6`。
- `i = 6`: `%82` を読み、`bytes[2] = 0x82`。`i = 9`。
- `i = 9` で文字列の終わりに着く。
- `new String(bytes, 0, 3, UTF-8)` は `"あ"`。

## ここがすごい

- **まとめて変換する理由**: `%E3` だけでは、UTF-8 の文字として意味をなしません。連続する `%XX` を一度に集めることで、マルチバイト文字が正しく戻ります。1 つずつ変換すると、文字化けを起こす典型的な誤りです。
- **無駄なコピーの回避**: `%` がなければ元の文字列を返し、`%` があっても、`%` より前の部分は一度にコピーします。変換が不要な大部分の文字列を、速く通り抜けます。
- **ほぼ 3 文字に 1 バイト**: `bytes` の大きさを `(length - i) / 3` とするのは、`%XX` が 3 文字で 1 バイトを表すからです。確保する量の上限を、この計算で決めています。
- **不正な入力の扱い**: 16 進数として読めなければ `NumberFormatException` を、`IllegalArgumentException` に変えて投げます。「どの部分が悪いか」を、文字列の一部を含めて分かりやすく伝えています。

## まとめ

- 連続する `%XX` は、まとめてバイト列にしてから文字コードで変換する。
- マルチバイト文字は、複数の `%XX` にまたがるので、1 つずつ変換してはいけない。
- 変換が不要な場合は、元の文字列を素早く返す。
