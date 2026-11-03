---
title: "透明度を十段階の名前で選ぶ"
description: "Tachyons の .o-100 から .o-0 までは、opacity を 1 から 0 まで段階的に決める。数値を覚えずに、薄さを名前で指定できる、透明度の決まりごと。"
language: css
project: undefined
repo: https://github.com/tachyons-css/tachyons
license: MIT
copyright: "\"Copyright © 2020 Adam Morse & John Otander\""
commit: "2cb90e90f934e405cc51f9a49ba3e1a2c74bda0c"
file: src/_opacity.css
lines: [8, 20]
function: "\".o-100, .o-90, .o-80 … .o-0\""
difficulty: 1
format: 2
tags: [配色]
---
## ひとことで

Tachyons の `.o-100` から `.o-0` までは、透明度を段階で選べるクラスです。`.o-50` と書けば、半分の濃さになります。

## コード

```css:line-numbers=8
.o-100 { opacity: 1;    }
.o-90  { opacity: .9;   }
.o-80  { opacity: .8;   }
.o-70  { opacity: .7;   }
.o-60  { opacity: .6;   }
.o-50  { opacity: .5;   }
.o-40  { opacity: .4;   }
.o-30  { opacity: .3;   }
.o-20  { opacity: .2;   }
.o-10  { opacity: .1;   }
.o-05  { opacity: .05;  }
.o-025 { opacity: .025; }
.o-0   { opacity: 0; }
```

## 前提知識

- **opacity**: 要素の不透明度です。1 は完全に見え、0 は完全に透明です。
- **段階の名前**: Tachyons は、数値を小数点で書かず、100 から 0 までの数字で名前を付けています。
- **細かい段階**: 05 や 025 のように、小さな値も用意されています。ごくわずかな薄さを表すときに使います。

## 何をしているか

### 1. 大きい段階

```css:line-numbers=8
.o-100 { opacity: 1;    }
.o-90  { opacity: .9;   }
.o-80  { opacity: .8;   }
.o-70  { opacity: .7;   }
.o-60  { opacity: .6;   }
```

100 から 60 までは、10 刻みで透明度を下げます。文字や画像を少しだけ薄くしたいときに選びます。

### 2. 小さい段階

```css:line-numbers=13
.o-50  { opacity: .5;   }
.o-40  { opacity: .4;   }
.o-30  { opacity: .3;   }
.o-20  { opacity: .2;   }
.o-10  { opacity: .1;   }
.o-05  { opacity: .05;  }
.o-025 { opacity: .025; }
.o-0   { opacity: 0; }
```

50 から 0 までは、さらに薄くなります。0 は、見えないけれど場所は残す、という使い方ができます。

## ここがすごい

透明度を名前で決めることで、CSS の数値を覚えなくても、クラスの名前だけで薄さが分かります。HTML を読むだけで、どの段階なのかが伝わります。

透明度は、数字の大きさで段階を覚えると、デザインの指示と結びつきやすくなります。たとえば、補足の文字に o-60、背景の画像に o-20 のように、役割と段階を対応させられます。小さい段階は、ほとんど見えない装飾に使えます。名前が決まっていると、チーム内で同じ薄さを指すときにも、話が通じやすくなります。

## まとめ

名前付きの透明度の段階は、デザインの決まりごとを、そのまま HTML に書ける形にしています。
