/* ===== CAPTURAR ELEMENTOS DO HTML ===== */
const display = document.getElementById("display");
const historico = document.getElementById("historico");
const cientifica = document.getElementById("cientifica");
const menuDropdown = document.getElementById("menuDropdown");
const modoAnguloBtn = document.getElementById("modoAngulo");

let modo = "padrao";
let modoAngulo = "DEG";
let ANS = 0;

/* ================= MENU ================= */
function toggleMenu(){
    menuDropdown.style.display =
        menuDropdown.style.display==="block"?"none":"block";
}

function setModo(novoModo){
    modo=novoModo;
    toggleMenu();
    cientifica.style.display = modo==="cientifica"?"grid":"none";
}

function alternarAngulo(){
    modoAngulo = modoAngulo==="DEG"?"RAD":"DEG";
    modoAnguloBtn.innerText = modoAngulo;
}

/* ================= DISPLAY ================= */
function btn(v){
    if(display.value==="0") display.value="";
    display.value += v==="ANS" ? ANS : v;
}

function limparTela(){ display.value="0"; }
function limparTudo(){ display.value="0"; historico.innerHTML=""; }

function backspace(){
    display.value = display.value.length>1 ? display.value.slice(0,-1) : "0";
}

/* ================= BOTÃO ± ================= */
function trocarSinal(){
    let v = display.value;
    if(v === "0") return;

    if(v.startsWith("(0-") && v.endsWith(")")){
        display.value = v.slice(3,-1);
    }else{
        display.value = "(0-" + v + ")";
    }
}

/* ================= FATORIAL ================= */
function factorial(n){
    if(n<0) throw "Fatorial de número negativo";
    let r=1;
    for(let i=1;i<=n;i++) r*=i;
    return r;
}

/* ================= PORCENTAGEM ================= */
function tratarPorcentagem(expr){
    return expr.replace(/(\d+(?:\.\d+)?)([\+\-\*/])(\d+(?:\.\d+)?)%/g,
        (m,a,op,b)=>{
            a=parseFloat(a);
            b=parseFloat(b)/100;
            return (op==="+"||op==="-"?`${a}${op}${a*b}`:`${a}${op}${b}`);
        });
}

/* ================= CONVERSÕES ================= */
function converterBases(expr){

    function erro(msg){ throw msg; }

    function dec(v){
        if(!/^-?\d+$/.test(v)) erro("Número decimal inválido");
        return parseInt(v,10);
    }

    function bin(v){
        if(!/^0b[01]+$/i.test(v)) erro("Binário inválido");
        return parseInt(v.slice(2),2);
    }

    function oct(v){
        if(!/^0o[0-7]+$/i.test(v)) erro("Octal inválido");
        return parseInt(v.slice(2),8);
    }

    function hex(v){
        if(!/^0x[0-9a-f]+$/i.test(v)) erro("Hexadecimal inválido");
        return parseInt(v.slice(2),16);
    }

    if(expr.startsWith("bin(")&&expr.endsWith(")")){
        let v=expr.slice(4,-1).trim();
        return v.startsWith("0b")?bin(v):"0b"+dec(v).toString(2);
    }
    if(expr.startsWith("oct(")&&expr.endsWith(")")){
        let v=expr.slice(4,-1).trim();
        return v.startsWith("0o")?oct(v):"0o"+dec(v).toString(8);
    }
    if(expr.startsWith("hex(")&&expr.endsWith(")")){
        let v=expr.slice(4,-1).trim();
        return v.startsWith("0x")?hex(v):"0x"+dec(v).toString(16);
    }

    return null;
}

/* ================= MOTOR MATEMÁTICO ================= */
const OPERADORES={
    "+":{prec:1,fn:(a,b)=>a+b},
    "-":{prec:1,fn:(a,b)=>a-b},
    "*":{prec:2,fn:(a,b)=>a*b},
    "/":{prec:2,fn:(a,b)=>a/b},
    "^":{prec:3,fn:(a,b)=>Math.pow(a,b)}
};

function paraRad(x){
    return modoAngulo==="DEG" ? x*Math.PI/180 : x;
}

const FUNCOES={
    sin:(x)=>Math.sin(paraRad(x)),
    cos:(x)=>Math.cos(paraRad(x)),
    tan:(x)=>Math.tan(paraRad(x)),
    log:Math.log10,
    ln:Math.log,
    sqrt:Math.sqrt,
    cbrt:Math.cbrt,
    exp:Math.exp
};

function tokenizar(expr){
    expr=expr.replace(/inv\(([^)]+)\)/g,"(1/($1))")
             .replace(/\bpi\b/g,Math.PI)
             .replace(/\be\b/g,Math.E);
    return expr.match(/\d+\.?\d*|[()+\-*/^!]|[A-Za-z]+/g);
}

function paraRPN(tokens){
    let out=[],stack=[];
    tokens.forEach(t=>{
        if(!isNaN(t)) out.push(parseFloat(t));
        else if(t in FUNCOES) stack.push(t);
        else if(t in OPERADORES){
            while(stack.length){
                let top=stack.at(-1);
                if(top in OPERADORES && OPERADORES[top].prec>=OPERADORES[t].prec)
                    out.push(stack.pop());
                else break;
            }
            stack.push(t);
        }
        else if(t==="(") stack.push(t);
        else if(t===")"){
            while(stack.at(-1)!=="(") out.push(stack.pop());
            stack.pop();
        }
        else if(t==="!") out.push("!");
    });
    return out.concat(stack.reverse());
}

function avaliarRPN(rpn){
    let s=[];
    rpn.forEach(t=>{
        if(typeof t==="number") s.push(t);
        else if(t==="!") s.push(factorial(s.pop()));
        else if(t in OPERADORES){
            let b=s.pop(), a=s.pop();
            if(t==="/" && b===0) throw "Divisão por zero";
            s.push(OPERADORES[t].fn(a,b));
        }
        else if(t in FUNCOES) s.push(FUNCOES[t](s.pop()));
    });

    if(s.length!==1) throw "Expressão inválida";
    return s[0];
}

function avaliarSeguro(expr){
    return avaliarRPN(paraRPN(tokenizar(expr)));
}

function formatarResultado(v){
    if(typeof v === "number"){
        return Number.isInteger(v) ? v : Number(v.toFixed(6));
    }
    return v;
}

function mostrarHistorico(expr, resultado){
    const linha = document.createElement("div");
    linha.textContent = expr + " = " + resultado;
    linha.onclick = () => display.value = resultado;
    historico.prepend(linha);
}

function calcular(){
    let exprOriginal = display.value.trim();

    try{
        let expr = tratarPorcentagem(exprOriginal);
        let conv = converterBases(expr);
        let resultado = conv !== null ? conv : avaliarSeguro(expr);

        resultado = formatarResultado(resultado);
        ANS = resultado;
        mostrarHistorico(exprOriginal, resultado);
        display.value = resultado;

    }catch(err){
        alert(err || "Erro na expressão");
    }
}

/* ================= TECLADO ================= */
document.addEventListener("keydown", e => {

    if(e.key==="Enter"){ e.preventDefault(); calcular(); return; }
    if(e.key==="Backspace"){ e.preventDefault(); backspace(); return; }

    if(e.key==="," || e.key==="."){ btn("."); return; }

    if(/^[a-zA-Z]$/.test(e.key)){
        btn(e.key.toLowerCase());
        return;
    }

    const permitidos="0123456789+-*/()%^!";
    if(permitidos.includes(e.key)) btn(e.key);
});


/* ================= FECHAR MENU AO CLICAR FORA ================= */
document.addEventListener("click", e => {
    if(!e.target.closest(".menu-icon") && !e.target.closest("#menuDropdown")){
        menuDropdown.style.display = "none";
    }
});

