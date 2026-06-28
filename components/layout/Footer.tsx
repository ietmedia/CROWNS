import Link from "next/link";

const SALON = {
  name: "Crowns Enchanted",
  address: "2900 Delk Road SE, Suite 17, Marietta, GA 30067",
  phone: "470-495-8894",
  email: "Info@crownsenchanted.com",
  instagram: "@crownsenchanted",
  hours: [
    { day: "Tuesday", time: "9am – 6pm" },
    { day: "Wednesday", time: "10am – 6pm" },
    { day: "Thursday", time: "9am – 6pm" },
    { day: "Friday", time: "9am – 5pm" },
    { day: "Saturday", time: "9am – 5pm" },
    { day: "Sun & Mon", time: "Closed" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-border">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <h3 className="font-display text-2xl text-gradient-gold mb-4">
              Crowns Enchanted
            </h3>
            <p className="text-text-secondary text-sm leading-relaxed mb-6">
              Holistic hair care where scalp science meets ancestral wisdom.
              Your crown is sacred — we treat it that way.
            </p>
            <a
              href={`https://instagram.com/crownsenchanted`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold text-sm hover:text-gold-light transition-colors"
            >
              {SALON.instagram}
            </a>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-display text-lg text-text-primary mb-4">Hours</h4>
            <ul className="space-y-2">
              {SALON.hours.map(({ day, time }) => (
                <li key={day} className="flex justify-between text-sm">
                  <span className="text-text-secondary">{day}</span>
                  <span
                    className={
                      time === "Closed" ? "text-text-muted" : "text-text-primary"
                    }
                  >
                    {time}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact + Links */}
          <div>
            <h4 className="font-display text-lg text-text-primary mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href={`tel:${SALON.phone}`}
                  className="text-text-secondary hover:text-gold transition-colors"
                >
                  {SALON.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${SALON.email}`}
                  className="text-text-secondary hover:text-gold transition-colors"
                >
                  {SALON.email}
                </a>
              </li>
              <li className="text-text-secondary">{SALON.address}</li>
            </ul>

            <div className="mt-6 flex flex-col gap-2">
              <Link
                href="/book"
                className="text-gold text-sm hover:text-gold-light transition-colors"
              >
                Book an Appointment →
              </Link>
              <Link
                href="/my-membership"
                className="text-text-secondary text-sm hover:text-text-primary transition-colors"
              >
                Membership Plans
              </Link>
              <Link
                href="/shop"
                className="text-text-secondary text-sm hover:text-text-primary transition-colors"
              >
                Shop
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-text-muted text-xs">
            © {new Date().getFullYear()} Crowns Enchanted. All rights reserved.
          </p>
          <p className="text-text-muted text-xs">Marietta, GA · By Appointment</p>
        </div>
      </div>
    </footer>
  );
}
