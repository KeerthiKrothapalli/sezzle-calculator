function show(val) {
    document.getElementById("result").value += val
}

function compute() {
    let x = document.getElementById("result").value
    let y = eval(x)
    document.getElementById("input").value = x + "=" + y
    document.getElementById("result").value = y
    $("input").change()
}

function clr() {
    document.getElementById("result").value = ""
} 