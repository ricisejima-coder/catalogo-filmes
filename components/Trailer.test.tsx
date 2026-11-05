import { render, screen } from "@testing-library/react";
import { Trailer } from "./Trailer";

it("trailer usa youtube-nocookie e some sem id", () => {
  const { container, rerender } = render(<Trailer youtubeId={null} />);
  expect(container).toBeEmptyDOMElement();
  rerender(<Trailer youtubeId="abc" />);
  expect(screen.getByTitle("Trailer")).toHaveAttribute("src", "https://www.youtube-nocookie.com/embed/abc");
});
