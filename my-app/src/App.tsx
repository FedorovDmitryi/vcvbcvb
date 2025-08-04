import React, {useCallback, useEffect, useRef, useState} from "react";
import axios from "axios";
import {DndProvider, useDrag, useDrop} from "react-dnd";
import {HTML5Backend} from "react-dnd-html5-backend";
import update from "immutability-helper";

const ItemTypes = {
	ROW: "row"
};

function Row({
	             id,
	             index,
	             moveRow,
	             isSelected,
	             onSelect,
	             value,
	             postUpdatedOrder,
	             items,
	             color,
	             key
             }: any) {
	const ref = useRef(null);
	const [, drop] = useDrop({
		accept: ItemTypes.ROW,
		hover(draggedItem: any) {
			const dragIndex = items.findIndex((item: any) => item.id === draggedItem.id);
			const hoverIndex = index;

			if (dragIndex === -1 || dragIndex === hoverIndex) return;

			moveRow(dragIndex, hoverIndex);

			draggedItem.index = hoverIndex;
		},
	});


	const [{isDragging}, drag] = useDrag({
		type: ItemTypes.ROW,
		item: {id},
		collect: (monitor) => ({
			isDragging: monitor.isDragging(),
		}),
		end: (item, monitor) => {
			if (!monitor.didDrop()) return;

			const movedId = item.id;
			const newIndex = items.findIndex((el: any) => el.id === item.id);
			const targetItem = items[newIndex + 1]; // элемент после перемещённого
			const targetId = targetItem?.id || null;

			postUpdatedOrder(movedId, targetId);
		}
	});
	drag(drop(ref));

	return (
		<div
			ref={ref}
			style={{
				opacity: isDragging ? 0.5 : 1,
				background: isSelected ? "#def" : "#fff",
				backgroundColor: color,
				padding: "8px",
				border: "1px solid #ccc",
				marginBottom: "4px",
				display: "flex",
				alignItems: "center"
			}}
		>
			<input type="checkbox" checked={isSelected}
			       onChange={() => onSelect(id)}/>
			<span style={{marginLeft: 10}}>{value}</span>
		</div>
	);
}

const PAGE_SIZE = 20;
type Item = {
	id: number,
	value: string,
	selected: boolean,
	color: string,
}
export default function App() {
	const [items, setItems] = useState<Item[]>([]);
	const [selected, setSelected] = useState<number[]>([]);
	const [hasMore, setHasMore] = useState(true);
	const [search, setSearch] = useState("");
	const page = useRef(0);
	const loading = useRef(false);

	const fetchItems = async () => {
		if (loading.current || !hasMore) return;
		loading.current = true;
		const res = await axios.get("/api/items", {
			params: {offset: page.current * PAGE_SIZE, search}
		});
		const newItems = res.data;
		setItems((prev) => [...prev, ...newItems]);
		setHasMore(newItems.length === PAGE_SIZE);
		page.current++;
		loading.current = false;
	};

	useEffect(() => {
		const onScroll = () => {
			if (
				window.innerHeight + document.documentElement.scrollTop >=
				document.documentElement.offsetHeight - 100
			) {
				fetchItems();
			}
		};
		window.addEventListener("scroll", onScroll);
		return () => window.removeEventListener("scroll", onScroll);
	});

	useEffect(() => {
		page.current = 0;
		setItems([]);
		setHasMore(true);
		fetchItems();
	}, [search]);

	const moveRow = useCallback((dragIndex: number, hoverIndex: number) => {
		setItems((prevItems) => {
			const draggedItem = prevItems[dragIndex];
			const newItems = update(prevItems, {
				$splice: [
					[dragIndex, 1],
					[hoverIndex, 0, draggedItem],
				],
			});

			return newItems;
		});
	}, []);

	const postUpdatedOrder = useCallback((movedId: string, targetId: string | null) => {
		axios.post("/api/sort", {movedId, targetId});
	}, []);


	const handleSelect = async (id: number) => {
		const updatedItems = items.map(item =>
			item.id === id ? {...item, selected: !item.selected} : item
		);
		setItems(updatedItems);

		await axios.post("/api/select", {
			id,
			selected: !items.find(item => item.id === id)?.selected,
		});
	};

	return (
		<DndProvider backend={HTML5Backend}>
			<div style={{padding: 20}}>
				<input
					placeholder="Поиск..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					style={{marginBottom: 20, padding: 8, width: "100%"}}
				/>
				{items.map((item, index) => (
					<Row
						key={item.id}
						id={item.id}
						moveRow={moveRow}
						postUpdatedOrder={postUpdatedOrder}
						items={items}
						isSelected={item.selected}
						onSelect={handleSelect}
						value={item.value}
						color={item.color}
					/>
				))}
			</div>
		</DndProvider>
	);
}
