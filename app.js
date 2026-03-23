const SUPABASE_URL = "https://jojullesgwljkvfexpkl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvanVsbGVzZ3dsamt2ZmV4cGtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyODUyNjIsImV4cCI6MjA4OTg2MTI2Mn0.2C40ZYd2dQYxHd7FG2oRL-IWa7H_uMvUVj0Enz4B4ZA";

const headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation"
};

const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const footer = document.getElementById("footer");
const count = document.getElementById("count");
const clearBtn = document.getElementById("clear-done");

let todos = [];

async function fetchTodos() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/todos?order=created_at.asc`, { headers });
    todos = await res.json();
    render();
}

async function addTodo(text) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/todos`, {
        method: "POST",
        headers,
        body: JSON.stringify({ text, done: false })
    });
    const [todo] = await res.json();
    todos.push(todo);
    render();
}

async function updateTodo(id, updates) {
    await fetch(`${SUPABASE_URL}/rest/v1/todos?id=eq.${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(updates)
    });
}

async function deleteTodo(id) {
    await fetch(`${SUPABASE_URL}/rest/v1/todos?id=eq.${id}`, {
        method: "DELETE",
        headers
    });
}

function render() {
    list.innerHTML = "";
    todos.forEach((todo, i) => {
        const li = document.createElement("li");
        if (todo.done) li.classList.add("done");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = todo.done;
        checkbox.addEventListener("change", async () => {
            todos[i].done = checkbox.checked;
            await updateTodo(todo.id, { done: checkbox.checked });
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

            const finishEdit = async () => {
                const newText = editInput.value.trim();
                if (newText) {
                    todos[i].text = newText;
                    await updateTodo(todo.id, { text: newText });
                    render();
                } else {
                    todos.splice(i, 1);
                    await deleteTodo(todo.id);
                    render();
                }
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
        deleteBtn.addEventListener("click", async () => {
            todos.splice(i, 1);
            await deleteTodo(todo.id);
            render();
        });

        li.append(checkbox, span, deleteBtn);
        list.appendChild(li);
    });

    const remaining = todos.filter((t) => !t.done).length;
    count.textContent = `${remaining} görev kaldı`;
    footer.classList.toggle("hidden", todos.length === 0);
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    await addTodo(text);
});

clearBtn.addEventListener("click", async () => {
    const doneTodos = todos.filter((t) => t.done);
    todos = todos.filter((t) => !t.done);
    render();
    await Promise.all(doneTodos.map((t) => deleteTodo(t.id)));
});

fetchTodos();
