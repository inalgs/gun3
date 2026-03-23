const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const footer = document.getElementById("footer");
const count = document.getElementById("count");
const clearBtn = document.getElementById("clear-done");

let todos = JSON.parse(localStorage.getItem("todos") || "[]");

function save() {
    localStorage.setItem("todos", JSON.stringify(todos));
}

function render() {
    list.innerHTML = "";
    todos.forEach((todo, i) => {
        const li = document.createElement("li");
        if (todo.done) li.classList.add("done");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = todo.done;
        checkbox.addEventListener("change", () => {
            todos[i].done = checkbox.checked;
            save();
            render();
        });

        const span = document.createElement("span");
        span.textContent = todo.text;
        span.addEventListener("dblclick", () => {
            li.classList.add("editing");
            const editInput = document.createElement("input");
            editInput.type = "text";
            editInput.className = "edit-input";
            editInput.value = todo.text;
            li.appendChild(editInput);
            editInput.focus();

            const finishEdit = () => {
                const newText = editInput.value.trim();
                if (newText) {
                    todos[i].text = newText;
                } else {
                    todos.splice(i, 1);
                }
                save();
                render();
            };

            editInput.addEventListener("blur", finishEdit);
            editInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter") editInput.blur();
                if (e.key === "Escape") {
                    editInput.value = todo.text;
                    editInput.blur();
                }
            });
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "\u00D7";
        deleteBtn.addEventListener("click", () => {
            todos.splice(i, 1);
            save();
            render();
        });

        li.append(checkbox, span, deleteBtn);
        list.appendChild(li);
    });

    const remaining = todos.filter((t) => !t.done).length;
    count.textContent = `${remaining} görev kaldı`;
    footer.classList.toggle("hidden", todos.length === 0);
}

form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    todos.push({ text, done: false });
    input.value = "";
    save();
    render();
});

clearBtn.addEventListener("click", () => {
    todos = todos.filter((t) => !t.done);
    save();
    render();
});

render();
