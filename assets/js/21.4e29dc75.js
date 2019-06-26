(window.webpackJsonp=window.webpackJsonp||[]).push([[21],{48:function(t,a,s){"use strict";s.r(a);var n=s(0),e=Object(n.a)({},function(){var t=this,a=t.$createElement,s=t._self._c||a;return s("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[s("h1",[t._v("sagaMonitor")]),t._v(" "),s("p",[t._v("sagaMonitor 其实就是一个包含五个钩子函数的对象，在 saga 执行的不同阶段这五个钩子函数会分别触发：")]),t._v(" "),s("ol",[s("li",[t._v("effectTriggered: 当一个 effect 被触发时（通过 yield someEffect）")]),t._v(" "),s("li",[t._v("effectResolved: 如果该 effect 成功地被 resolve")]),t._v(" "),s("li",[t._v("effectRejected: 如果该 effect 因一个错误被 reject")]),t._v(" "),s("li",[t._v("effectCancelled: 如果该 effect 被取消")]),t._v(" "),s("li",[t._v("actionDispatched: 最后，当 Redux action 被发起时")])]),t._v(" "),s("h2",{attrs:{id:"源码位置"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#源码位置","aria-hidden":"true"}},[t._v("#")]),t._v(" 源码位置")]),t._v(" "),s("p",[s("code",[t._v("packages/core/src/internal/proc.js")]),s("br"),t._v(" "),s("code",[t._v("packages/core/src/internal/middleware.js")])]),t._v(" "),s("h2",{attrs:{id:"解析"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#解析","aria-hidden":"true"}},[t._v("#")]),t._v(" 解析")]),t._v(" "),s("p",[t._v("这五个钩子函数都是在 middleware 执行的时候触发的，只是分散在不同的函数内，关于 middleware 内部的执行解析可以去看"),s("router-link",{attrs:{to:"/proc.html"}},[t._v("这篇文章")])],1),t._v(" "),s("h3",{attrs:{id:"effecttriggered"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#effecttriggered","aria-hidden":"true"}},[t._v("#")]),t._v(" effectTriggered")]),t._v(" "),s("p",[t._v("effectTriggered 在 digestEffect 方法里面调用。")]),t._v(" "),s("div",{staticClass:"language-js extra-class"},[s("pre",{pre:!0,attrs:{class:"language-js"}},[s("code",[s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("function")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("digestEffect")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("effect"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" parentEffectId"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" cb"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" label "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token string"}},[t._v("''")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n    "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("const")]),t._v(" effectId "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("nextEffectId")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n    env"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("sagaMonitor "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("&&")]),t._v(" env"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("sagaMonitor"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("effectTriggered")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" effectId"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" parentEffectId"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" label"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" effect "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n\n    "),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// ......")]),t._v("\n"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n")])])]),s("h3",{attrs:{id:"effectresolved"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#effectresolved","aria-hidden":"true"}},[t._v("#")]),t._v(" effectResolved")]),t._v(" "),s("p",[t._v("effectResolved 在 currCb 方法里，当 isErr 为 false 时就会触发。")]),t._v(" "),s("div",{staticClass:"language-js extra-class"},[s("pre",{pre:!0,attrs:{class:"language-js"}},[s("code",[s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("function")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("currCb")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),s("span",{pre:!0,attrs:{class:"token parameter"}},[t._v("res"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" isErr")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// ......")]),t._v("\n\n  "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("if")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("env"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("sagaMonitor"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n    "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("if")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("isErr"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n      env"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("sagaMonitor"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("effectRejected")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("effectId"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" res"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n    "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("else")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n      env"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("sagaMonitor"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("effectResolved")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("effectId"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" res"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n    "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n\n  "),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// ......")]),t._v("\n"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n")])])]),s("h3",{attrs:{id:"effectrejected"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#effectrejected","aria-hidden":"true"}},[t._v("#")]),t._v(" effectRejected")]),t._v(" "),s("p",[t._v("effectResolved 在 currCb 方法里，当 isErr 为 true 时就会触发。")]),t._v(" "),s("div",{staticClass:"language-js extra-class"},[s("pre",{pre:!0,attrs:{class:"language-js"}},[s("code",[s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("function")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("currCb")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),s("span",{pre:!0,attrs:{class:"token parameter"}},[t._v("res"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" isErr")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// ......")]),t._v("\n\n  "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("if")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("env"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("sagaMonitor"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n    "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("if")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("isErr"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n      env"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("sagaMonitor"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("effectRejected")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("effectId"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" res"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n    "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("else")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n      env"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("sagaMonitor"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("effectResolved")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("effectId"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" res"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n    "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n\n  "),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// ......")]),t._v("\n"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n")])])]),s("h3",{attrs:{id:"effectcancelled"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#effectcancelled","aria-hidden":"true"}},[t._v("#")]),t._v(" effectCancelled")]),t._v(" "),s("p",[t._v("effectCancelled 是在 cb.cancel 方法里面触发的，这个 cb 是 digestEffect，如果你去看 "),s("router-link",{attrs:{to:"/proc.html"}},[t._v("proc")]),t._v(" 这一篇的话你会发现 cb 是 next 方法，它负责不断执行 saga。")],1),t._v(" "),s("div",{staticClass:"language-js extra-class"},[s("pre",{pre:!0,attrs:{class:"language-js"}},[s("code",[s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("function")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("digestEffect")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("effect"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" parentEffectId"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" cb"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" label "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token string"}},[t._v("''")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n  cb"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),s("span",{pre:!0,attrs:{class:"token function-variable function"}},[t._v("cancel")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=>")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n    "),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// ......")]),t._v("\n\n    env"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("sagaMonitor "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("&&")]),t._v(" env"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("sagaMonitor"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("effectCancelled")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("effectId"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n")])])]),s("h3",{attrs:{id:"actiondispatched"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#actiondispatched","aria-hidden":"true"}},[t._v("#")]),t._v(" actionDispatched")]),t._v(" "),s("p",[t._v("可以看到 actionDispatched 是在 saga 中间件里面调用的。")]),t._v(" "),s("div",{staticClass:"language-js extra-class"},[s("pre",{pre:!0,attrs:{class:"language-js"}},[s("code",[s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("function")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("sagaMiddleware")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),s("span",{pre:!0,attrs:{class:"token parameter"}},[s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" getState"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" dispatch "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")])]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// ......")]),t._v("\n\n  "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("return")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token parameter"}},[t._v("next")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=>")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token parameter"}},[t._v("action")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=>")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n    "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("if")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("sagaMonitor "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("&&")]),t._v(" sagaMonitor"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("actionDispatched"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n      sagaMonitor"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("actionDispatched")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("action"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n    "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n\n    "),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// ......")]),t._v("\n  "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n")])])])])},[],!1,null,null,null);a.default=e.exports}}]);