---
title: 打ち間違えた名前に、近い候補を提案する
description: Twig の SyntaxError の addSuggestions は、未定義の名前に対して、編集距離の近い候補を「Did you mean」の形で示します。利用者が、変数名やフィルター名の打ち間違いにすぐ気づけるようにする仕組みです。
language: php
project: Twig
repo: https://github.com/twigphp/Twig
license: BSD-3-Clause
copyright: Copyright (c) 2009-present by the Twig Team.
commit: "beb4b229784425ceb6514cec9c573b3e42b30703"
file: src/Error/SyntaxError.php
lines: [28, 45]
function: addSuggestions
difficulty: 2
format: 2
tags: [エラー処理, 文字列処理, 可読性]
---
## ひとことで

`addSuggestions` は、Twig のテンプレートに書かれた名前が見つからないとき、似た名前の候補を示して、エラーのメッセージに付け足す関数です。たとえば `nmae` と書いてしまったときに、`name` を候補として提案できます。打ち間違いを、利用者が自分で見つけやすくします。

## コード

```php:line-numbers=28
    public function addSuggestions(string $name, array $items): void
    {
        $alternatives = [];
        foreach ($items as $item) {
            $lev = levenshtein($name, $item);
            if ($lev <= \strlen($name) / 3 || str_contains($item, $name)) {
                $alternatives[$item] = $lev;
            }
        }

        if (!$alternatives) {
            return;
        }

        asort($alternatives);

        $this->appendMessage(\sprintf(' Did you mean "%s"?', implode('", "', array_keys($alternatives))));
    }
```

## 前提知識

- **編集距離（レーベンシュタイン距離）**: 2 つの文字列を一致させるのに必要な、1 文字の追加、削除、置き換えの回数です。値が小さいほど、よく似ています。
- **`levenshtein`**: PHP に用意されている、編集距離を計算する関数です。
- **`str_contains`**: 文字列が、別の文字列を含むかを調べる関数です。
- **`asort`**: 配列を値の小さい順に並べ替える関数です。キーとの対応は保たれます。
- **`SyntaxError`**: Twig のテンプレートの書き方が誤っているときに投げられる例外です。このクラスには、メッセージに追記する仕組みがあります。

## 何をしているか

### 1. 候補ごとに、似ているかを測る

```php:line-numbers=30
        $alternatives = [];
        foreach ($items as $item) {
            $lev = levenshtein($name, $item);
            if ($lev <= \strlen($name) / 3 || str_contains($item, $name)) {
                $alternatives[$item] = $lev;
            }
        }
```

`$items` の各候補について、`levenshtein($name, $item)` で距離を求めます。距離が名前の長さの 3 分の 1 以下であれば、または候補が名前を含んでいれば、候補に加えます。長さの 3 分の 1 という基準は、短い名前では少しの違いでも似ていると判断しないための目安です。

### 2. 候補が無ければ何もしない

```php:line-numbers=38
        if (!$alternatives) {
            return;
        }
```

似た候補が 1 つもなければ、メッセージを変えずに終わります。余計な提案を出さないための早い戻りです。

### 3. 近い順に並べて、メッセージに加える

```php:line-numbers=42
        asort($alternatives);

        $this->appendMessage(\sprintf(' Did you mean "%s"?', implode('", "', array_keys($alternatives))));
```

`asort` で距離の小さい順に並べ、候補名を `", "` でつないで、`Did you mean "..."?` の形の文を作ります。`appendMessage` で、元のエラーメッセージの後ろに付け足します。

## ここがすごい

- 完全一致ではなく、「少し違う」ものも候補にできるように、編集距離を使っています。打ち間違いの多くを、1 回の提案で拾えます。
- 基準を名前の長さに比例させているので、短い名前に多すぎる候補が出るのを防いでいます。判定の式が 1 行で、意図も読み取りやすくなっています。
- 候補を距離の順に並べるので、一番ありそうなものが先頭に来ます。利用者が、最初の候補を見るだけで直せることが多くなります。
- 例外のメッセージに追記するだけで、呼び出し側の処理を変える必要がありません。エラー処理の仕組みを、そのまま使い回せています。

## まとめ

`addSuggestions` は、見つからなかった名前に対して、編集距離の近い候補をエラーメッセージに添える関数です。距離の基準と並べ替えを組み合わせて、少ない行数で親切な提案を作っています。エラーを読む人の手間を減らす、小さくても効果の大きな工夫です。
