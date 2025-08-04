import express from 'express'
import cors from 'cors'

const app = express();

app.use(cors());
app.use(express.json());

const TOTAL_ITEMS = 1_000_000;

let allItems = Array.from({ length: TOTAL_ITEMS }, (_, i) => ({
	id: i + 1,
	value: `Элемент #${i + 1}`,
	selected: false,
	color: getPastelColor()
}));

function getPastelColor() {
	const r = Math.floor(Math.random() * 127 + 127);
	const g = Math.floor(Math.random() * 127 + 127);
	const b = Math.floor(Math.random() * 127 + 127);
	return `rgba(${r}, ${g}, ${b}, 0.4)`;
}

app.get("/items", (req, res) => {
	console.log('/items' + '?offset= ' + req.query.search?.toLowerCase() + '&search= ' +  req.query.offset)
	const offset = parseInt(req.query.offset) || 0;
	const search = req.query.search?.toLowerCase() || "";

	if (search) {
		const result = result.filter((item) => item.value.toLowerCase().includes(search));
			res.json(result.slice(offset, offset + 20));
			return null
		}

	res.json(allItems.slice(offset, offset + 20));
	return null
});

app.post("/select", (req, res) => {
	console.log('/select')
	const { id, selected } = req.body;

	const item = allItems.find((item) => item.id === id);
	if (!item) {
		return res.status(404).json({ error: "Item not found" });
	}

	item.selected = selected;

	res.json({ status: "ok", item });
});

app.post("/sort", (req, res) => {
	console.log('/sort')
	const { movedId, targetId } = req.body;

	const fromIndex = allItems.findIndex(item => item.id === movedId);
	const toIndex = targetId
		? allItems.findIndex(item => item.id === targetId)
		: allItems.length;

	const [movedItem] = allItems.splice(fromIndex, 1);

	const adjustedToIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;

	allItems.splice(adjustedToIndex, 0, movedItem);

	res.json({ status: "ok" });
});

app.listen(3001, () => {
	console.log("Сервер запущен на http://localhost:3001");
});
