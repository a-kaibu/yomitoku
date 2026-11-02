---
title: 公開か非公開かを、ファイルの権限の数字に変える
description: Flysystem の PortableVisibilityConverter::forFile は、public と private の文字を、Unix のファイル権限の数値に変えます。入力を先に検査してから、三項演算子で選ぶ短い処理です。
language: php
project: Flysystem
repo: https://github.com/thephpleague/flysystem
license: MIT
copyright: Copyright (c) 2013-2026 Frank de Jonge
commit: "1e748897e0a8e897b5a8bc8942e05f4f57fa248c"
file: src/UnixVisibility/PortableVisibilityConverter.php
lines: [21, 28]
function: PortableVisibilityConverter::forFile
difficulty: 2
format: 2
tags: [防御的プログラミング, API設計, システムコール]
---
## ひとことで

`forFile` は、「public」か「private」という公開範囲の文字を、Unix のファイル権限を表す整数に変換するメソッドです。Flysystem は、ストレージの種類に関係なく同じ呼び方ができるように、この変換を 1 か所にまとめています。

## コード

```php:line-numbers=21
    public function forFile(string $visibility): int
    {
        PortableVisibilityGuard::guardAgainstInvalidInput($visibility);

        return $visibility === Visibility::PUBLIC
            ? $this->filePublic
            : $this->filePrivate;
    }
```

## 前提知識

- **Unix のファイル権限**: ファイルに対して、所有者・グループ・その他のユーザーが読み書きできるかを決める仕組みです。`0644` のように 8 進数で書きます。
- **8 進数の数字**: `0644` の先頭の `0` は、8 進数であることを示す印です。PHP では `0` で始まる数字がこの形になります。
- **三項演算子 `? :`**: `条件 ? A : B` の形で、条件が真なら A、偽なら B を値として返す書き方です。
- **`Visibility::PUBLIC`**: 公開範囲を表す定数です。`'public'` という文字列と同じ値です。
- **`$this->filePublic`**: コンストラクタで決めた、公開用のファイル権限の数値です。
- **ガード**: 入力が正しいかを確かめて、おかしければ例外を投げる仕組みです。`guardAgainstInvalidInput` がその役割を持ちます。

## 何をしているか

### 1. 入力を先に検査する

```php:line-numbers=23
        PortableVisibilityGuard::guardAgainstInvalidInput($visibility);
```

最初に、受け取った文字列が `public` か `private` のどちらかを確かめます。違う値なら、ここで例外になり、後の処理には進みません。

変換の前に検査するので、この後の処理は「必ず 2 つのどちらか」を前提に書けます。

### 2. 公開か非公開かで権限を選ぶ

```php:line-numbers=25
        return $visibility === Visibility::PUBLIC
            ? $this->filePublic
            : $this->filePrivate;
```

`$visibility` が `public` と一致するなら、公開用の権限 `$this->filePublic` を返します。それ以外は、非公開用の `$this->filePrivate` を返します。

検査を通っているので、「それ以外」は必ず `private` です。

## ここがすごい

- **検査と変換を分けている**: 入力の正しさを `guardAgainstInvalidInput` に任せ、この関数は変換だけを書いています。ルールの変更は、ガード側で 1 か所を直せば済みます。
- **値は後から決められる**: 権限の数値は `$this->filePublic` などのプロパティに入っています。コンストラクタで別の値を渡せば、サーバーの設定に合わせて変えられます。
- **三項演算子で 1 回の判断**: 2 つの値の選択を 1 行で書いています。判断が 1 つしかないので、3 行に分けるより意図が分かりやすくなっています。
- **ストレージに依存しない名前**: 「public」「private」という一般的な言葉を使い、Unix の数字は内部に隠しています。利用者は仕組みを知らなくても使えます。

## まとめ

- 公開範囲の文字列は、検査してから権限の数値に変換する。
- 変換の前に入力を検査すると、後の処理の前提が単純になる。
- 三項演算子で 2 つの値を選ぶと、1 回の判断を 1 行で表せる。
- 外部の概念（権限の数字）は、内部のメソッドに閉じ込めると利用者が扱いやすい。
