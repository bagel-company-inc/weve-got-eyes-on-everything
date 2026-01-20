from pandas import DataFrame
from networkx import NetworkXNoPath, NodeNotFound, MultiGraph, shortest_path


def connectivity_to_graph(connectivity: DataFrame, attributes: bool = False) -> MultiGraph:
    assert not attributes, "Attributes not implemented yet"
    G = MultiGraph()
    for row in connectivity.itertuples():
        node_a: str = row.node_1
        node_b: str | None = row.node_2

        G.add_node(node_a)
        if node_b is None:
            continue
        G.add_node(node_b)

        if row.normal_position:
            G.add_edge(node_a, node_b, row.name)

    return G


def graph_shortest_path(node_a: str, node_b: str, graph: MultiGraph) -> list[str]:
    try:
        node_path: list[str] = shortest_path(graph, node_a, node_b)
    except NetworkXNoPath, NodeNotFound:
        return []
    edge_path: list[str] = []
    for i, current_node in enumerate(node_path):
        if i == 0:
            continue
        previous_node: str = node_path[i - 1]
        edges: list[str] = list(graph.get_edge_data(current_node, previous_node).keys())
        edge: str = edges[0]
        edge_path.append(edge)
    return edge_path
