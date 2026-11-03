---
title: "注釈の small の文字を少し小さくする"
description: "normalize.css は small の font-size を 80% にし、注釈や補足の文字を本文より控えめに見せる。ブラウザが既定で付ける大きさを、一つの割合で決め直す指定。"
language: css
project: undefined
repo: https://github.com/necolas/normalize.css
license: MIT
copyright: "\"Copyright © Nicolas Gallagher and Jonathan Neal\""
commit: "fc091cce1534909334c1911709a39c22d406977b"
file: normalize.css
lines: [116, 118]
function: "\"small\""
difficulty: 1
format: 2
tags: [配色, 可読性]
---
## ひとことで

normalize.css は、補足や注釈を表す `small` 要素の文字を、本文の 80% の大きさにします。注釈が本文に埋もれず、かつ読める大きさを保ちます。

## コード

```css:line-numbers=116
small {
  font-size: 80%;
}
```

## 前提知識

- **small 要素**: 注釈や免責事項などの、補足の文字を表す HTML の要素です。意味は補足で、見た目を決めるものではありません。
- **%**: 親の文字の大きさに対する割合です。80% なら、親の 0.8 倍になります。
- **既定の大きさ**: ブラウザは small を、少し小さく描きます。ただし、その割合は一定ではありませんでした。

## 何をしているか

### 1. 大きさを割合で決める

```css:line-numbers=117
  font-size: 80%;
```

font-size を 80% にして、注釈を親の文字より小さくします。親の大きさが変わっても、比率は保たれます。

## ここがすごい

割合で指定しているため、補足の文字を、どの場所に置いても同じ比率で小さく表示できます。見出しの中の small でも、自然に縮みます。

注釈の文字が本文と同じ大きさだと、どれが本文でどれが補足か、読み手が判断しにくくなります。small を小さく描くことで、補足であることが自然に伝わります。ただし、小さすぎると読めなくなるため、normalize は 80% という控えめな割合を選んでいます。

補足の文字は、画面の隅や図の下に置かれることが多く、本文より小さくても、役割を保てるように作られています。

## まとめ

small の大きさを割合で決めると、補足の文字を本文に対して一定の比率で沈めることができます。
