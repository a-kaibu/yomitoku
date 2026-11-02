---
title: テンプレートの区切り記号を途中で変える
description: mustache.php の changeDelimiters は、テンプレートの中の「=」で囲まれた指定から、{{ }} の代わりに使う区切り記号を読み取ります。書いた後の部分から、新しい区切り記号で字句解析を続けられるようにしています。
language: php
project: mustache.php
repo: https://github.com/bobthecow/mustache.php
license: MIT
copyright: Copyright (c) 2010-2026 Justin Hileman
commit: "c33d74b6dc5b83b6cecd23583b4085d1f4e25332"
file: src/Tokenizer.php
lines: [303, 327]
function: changeDelimiters
difficulty: 3
format: 2
tags: [パース, 状態機械, 正規表現]
---
## ひとことで

`changeDelimiters` は、Mustache のテンプレートの途中で、タグを囲む記号（区切り記号）を別の記号に変えるための関数です。`{{=<% %>=}}` と書かれると、以後は `<% name %>` の形で変数を書けるようになります。その指定を読み取って、字句解析の状態を更新する役目を持ちます。

## コード

```php:line-numbers=303
    private function changeDelimiters($text, $index)
    {
        $startIndex = strpos($text, '=', $index) + 1;
        $close      = '=' . $this->ctag;
        $closeIndex = strpos($text, $close, $index);

        if ($closeIndex === false) {
            $this->throwUnclosedTagException();
        }

        $token = [
            self::TYPE => self::T_DELIM_CHANGE,
            self::LINE => $this->line,
        ];

        try {
            $this->setDelimiters(trim(substr($text, $startIndex, $closeIndex - $startIndex)));
        } catch (InvalidArgumentException $e) {
            throw new SyntaxException($e->getMessage(), $token);
        }

        $this->tokens[] = $token;

        return $closeIndex + strlen($close) - 1;
    }
```

## 前提知識

- **Mustache**: ロジックを持たず、タグ（変数や区間）だけでテンプレートを書く仕組みです。HTML の中に `{{name}}` のような印を置いて、データを差し込みます。
- **字句解析（トークナイザ）**: 文字の並びを、「テキスト」「変数」「区間の開始」などの意味のある単位（トークン）に分ける作業です。
- **区切り記号（デリミタ）**: タグの始まりと終わりを示す記号の組です。標準では始まりが `{{`、終わりが `}}` です。
- **`strpos` と `substr`**: 文字列の中で、ある文字の位置を探す関数（`strpos`）と、位置を指定して一部を切り出す関数（`substr`）です。
- **例外（`try` と `catch`）**: 処理の途中で問題が起きたとき、そこで処理を止めて、別の場所で受け止める仕組みです。

## 何をしているか

### 1. 新しい区切り記号の範囲を探す

```php:line-numbers=305
        $startIndex = strpos($text, '=', $index) + 1;
        $close      = '=' . $this->ctag;
        $closeIndex = strpos($text, $close, $index);

        if ($closeIndex === false) {
            $this->throwUnclosedTagException();
        }
```

`$startIndex` は、`=` の直後の位置を表します。`$close` には、今の終わりの区切りに `=` を付けた文字列（たとえば `=}}`）を入れます。`$closeIndex` は、その文字列が現れる位置です。見つからなければ、`throwUnclosedTagException` で、閉じていないタグとして例外にします。

### 2. トークンを作って、区切り記号を更新する

```php:line-numbers=313
        $token = [
            self::TYPE => self::T_DELIM_CHANGE,
            self::LINE => $this->line,
        ];

        try {
            $this->setDelimiters(trim(substr($text, $startIndex, $closeIndex - $startIndex)));
        } catch (InvalidArgumentException $e) {
            throw new SyntaxException($e->getMessage(), $token);
        }
```

`$token` には、この指定が「区切り記号の変更」であることと、行番号を入れます。`substr` で `=` と閉じの印の間を切り出し、`trim` で前後の空白を落としてから、`setDelimiters` に渡します。`setDelimiters` は、`<% %>` のような 2 つの語を読み、開始と終了の記号を保存します。

もし指定の形式が正しくなければ、`setDelimiters` が `InvalidArgumentException` を投げます。この関数はそれを受け止め、`SyntaxException` に作り直して投げ直します。エラーの位置が分かるように、トークンの情報を付けています。

### 3. 次に読み始める位置を返す

```php:line-numbers=324
        $this->tokens[] = $token;

        return $closeIndex + strlen($close) - 1;
```

最後に、トークンを `$this->tokens` に追加し、閉じの印の末尾を計算して返します。呼び出し側は、返された位置から、新しい区切り記号で読み進めます。

## ここがすごい

- 区切り記号の変更を、特別な文法ではなく、字句解析の中の 1 つのトークンとして扱っています。後の処理は、「区切り記号が変わった」というトークンの有無を気にせずに済みます。
- 区切り記号の形式が正しくないときは、例外を作り直して、どの行の問題かが分かるようにしています。利用者が書いたテンプレートの誤りを、見つけやすくしています。
- 読み取りを、`strpos` で終わりの位置を見つけて `substr` で切り出すという、文字列操作だけで済ませています。正規表現の複雑な組み立ては、`setDelimiters` の中の 1 か所に限られています。
- 戻り値が「閉じの印の末尾」なので、呼び出し側はこの位置から読み進めるだけで済みます。字句解析の位置の管理が、単純な 1 本の流れになっています。

## まとめ

`changeDelimiters` は、`{{=新しい開始 新しい終了=}}` の形を読み取り、以後の字句解析で使う区切り記号を入れ替える関数です。区切り記号の変更を、トークンとして記録しながら、読む位置を進めていきます。Mustache のテンプレートが、途中で書き方を変えられる仕組みが、この短い関数に収まっています。
